import type { Job } from '@cook-mode/redis';
import { createPubSub, CHANNELS } from '@cook-mode/redis';
import { openaiConfig } from '@cook-mode/config';
import { getUserSavedRecipes } from '@cook-mode/db';
import { searchByText, textToVector } from '@cook-mode/vector';
import type {
  JobMessage,
  MealPlanGeneratePayload,
  MealPlanProgressMessage,
  MealPlan,
  MealPlanRecipe,
} from '@cook-mode/shared';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

const pubsub = createPubSub();

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: openaiConfig.apiKey });
  }
  return openai;
}

async function publishProgress(jobId: string, progress: MealPlanProgressMessage): Promise<void> {
  await pubsub.publish(CHANNELS.mealplan(jobId), progress as unknown as Record<string, unknown>);
}

interface RecipeSearchResult {
  id: string;
  title: string;
  ingredients: string[];
  summary?: string | null;
  prepTime?: string | null;
  cookTime?: string | null;
  imageUrl?: string | null;
  fromSaved: boolean;
  ingredientMatchScore?: number;
}

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_saved_recipes',
      description:
        'Search the user\'s saved recipe collection. Saved recipes are preferred as a tiebreaker when ingredient match is similar. Results include ingredientMatchScore (0-1) showing how well the recipe uses available ingredients.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find recipes (e.g., "chicken pasta", "quick breakfast")',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_all_recipes',
      description:
        'Search the entire recipe database for recipes matching available ingredients. Use this to find recipes with better ingredient matches even if not in saved collection.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find recipes (e.g., "chicken pasta", "quick breakfast")',
          },
        },
        required: ['query'],
      },
    },
  },
];

// Calculate how well a recipe's ingredients match the available ingredients
function calculateMatchScore(recipeIngredients: string[], availableIngredients: string[]): number {
  if (recipeIngredients.length === 0) return 0;

  const availableLower = availableIngredients.map((i) => i.toLowerCase());
  let matched = 0;

  for (const ingredient of recipeIngredients) {
    const ingredientLower = ingredient.toLowerCase();
    if (
      availableLower.some(
        (avail) => ingredientLower.includes(avail) || avail.includes(ingredientLower)
      )
    ) {
      matched++;
    }
  }

  return matched / recipeIngredients.length;
}

async function searchSavedRecipes(
  userId: string,
  query: string,
  availableIngredients: string[]
): Promise<RecipeSearchResult[]> {
  const result = await getUserSavedRecipes(userId, 1, 100, false);

  // Simple text matching for saved recipes
  const lowerQuery = query.toLowerCase();
  const queryTerms = lowerQuery.split(/\s+/);

  // Helper to parse ingredients - handles both string and array formats
  const parseIngredients = (ingredients: string | string[] | null | undefined): string[] => {
    if (!ingredients) return [];
    if (Array.isArray(ingredients)) return ingredients;
    // Try to parse as JSON array, otherwise split by newlines
    try {
      const parsed = JSON.parse(ingredients);
      return Array.isArray(parsed) ? parsed : [ingredients];
    } catch {
      return ingredients.split('\n').filter(Boolean);
    }
  };

  const matches = result.data
    .filter((recipe) => {
      const titleLower = recipe.title.toLowerCase();
      const ingredientsList = parseIngredients(recipe.ingredients);
      const ingredientsLower = ingredientsList.join(' ').toLowerCase();
      const summaryLower = (recipe.summary || '').toLowerCase();

      return queryTerms.some(
        (term) =>
          titleLower.includes(term) || ingredientsLower.includes(term) || summaryLower.includes(term)
      );
    })
    .map((recipe) => {
      const ingredientsList = parseIngredients(recipe.ingredients);
      const matchScore = calculateMatchScore(ingredientsList, availableIngredients);
      return {
        id: recipe.id,
        title: recipe.title,
        ingredients: ingredientsList,
        summary: recipe.summary ?? null,
        prepTime: recipe.prepTime ?? null,
        cookTime: recipe.cookTime ?? null,
        imageUrl: recipe.imageUrl ?? null,
        fromSaved: true,
        ingredientMatchScore: matchScore,
      };
    })
    // Sort by ingredient match score (highest first)
    .sort((a, b) => (b.ingredientMatchScore ?? 0) - (a.ingredientMatchScore ?? 0))
    .slice(0, 10);

  return matches;
}

async function searchAllRecipes(query: string): Promise<RecipeSearchResult[]> {
  const results = await searchByText(query, textToVector, 10);

  return results.results.map((r) => ({
    id: r.payload.id,
    title: r.payload.title,
    ingredients: r.payload.ingredients || [], // Vector search may return ingredients
    summary: r.payload.summary ?? null,
    prepTime: null,
    cookTime: null,
    imageUrl: (r.payload.imageUrl as string | undefined) ?? null,
    fromSaved: false,
  }));
}

interface MealPlanResponse {
  now: {
    recipeId: string;
    title: string;
    reasoning: string;
    matchedIngredients: string[];
    missingIngredients: string[];
  };
  next: {
    recipeId: string;
    title: string;
    reasoning: string;
    matchedIngredients: string[];
    missingIngredients: string[];
  };
  later: {
    recipeId: string;
    title: string;
    reasoning: string;
    matchedIngredients: string[];
    missingIngredients: string[];
  };
}

export async function processMealPlanGenerate(job: Job<JobMessage>): Promise<void> {
  const { jobId, operation } = job.data;
  const payload = operation.payload as MealPlanGeneratePayload;
  const { userId, ingredients, preferences } = payload;

  const recipeCache = new Map<string, RecipeSearchResult>();

  try {
    // Stage 1: Searching saved recipes
    await publishProgress(jobId, {
      jobId,
      stage: 'searching_saved',
      progress: 10,
      message: 'Searching your saved recipes...',
    });

    await job.updateProgress(10);

    const client = getOpenAI();

    const systemPrompt = `You are a meal planning assistant. Based on the user's available ingredients, find and recommend 3 recipes organized as a meal plan:

- "now": A recipe that can be made immediately with most ingredients on hand
- "next": A recipe to make soon, may need a few extra ingredients
- "later": A recipe to plan for, good use of remaining ingredients

Guidelines:
1. Focus on finding recipes that use the available ingredients well
2. Search BOTH saved recipes and the full database to find best matches
3. Rank recipes primarily by how many available ingredients they use (check ingredientMatchScore)
4. When ingredient match is similar, prefer saved recipes as a tiebreaker
5. A database recipe with 80% ingredient match beats a saved recipe with 30% match
6. Consider dietary restrictions and preferences if provided
7. Try to use as many of the available ingredients as possible
8. Spread ingredient usage across all three meals

${preferences?.dietaryRestrictions?.length ? `Dietary restrictions: ${preferences.dietaryRestrictions.join(', ')}` : ''}
${preferences?.cuisinePreferences?.length ? `Cuisine preferences: ${preferences.cuisinePreferences.join(', ')}` : ''}
${preferences?.maxCookTime ? `Max cook time: ${preferences.maxCookTime} minutes` : ''}
${preferences?.additionalInstructions ? `User's additional instructions: ${preferences.additionalInstructions}` : ''}

After searching, respond with a JSON object containing the final meal plan with structure:
{
  "now": { "recipeId": "...", "title": "...", "reasoning": "...", "matchedIngredients": [...], "missingIngredients": [...] },
  "next": { "recipeId": "...", "title": "...", "reasoning": "...", "matchedIngredients": [...], "missingIngredients": [...] },
  "later": { "recipeId": "...", "title": "...", "reasoning": "...", "matchedIngredients": [...], "missingIngredients": [...] }
}`;

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Available ingredients: ${ingredients.join(', ')}\n\nPlease create a 3-meal plan using these ingredients. Find recipes that best use these ingredients - check both my saved recipes and the full database.`,
      },
    ];

    let attempts = 0;
    const maxAttempts = 10;
    let mealPlanResponse: MealPlanResponse | null = null;

    while (attempts < maxAttempts) {
      attempts++;

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools,
        tool_choice: 'auto',
      });

      const message = response.choices[0]?.message;
      if (!message) {
        throw new Error('No response from GPT-4o');
      }

      // Check if there are tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          let results: RecipeSearchResult[] = [];

          if (toolCall.function.name === 'search_saved_recipes') {
            await publishProgress(jobId, {
              jobId,
              stage: 'searching_saved',
              progress: 20 + attempts * 5,
              message: `Searching saved recipes for "${args.query}"...`,
            });

            results = await searchSavedRecipes(userId, args.query, ingredients);

            // Cache results
            for (const r of results) {
              recipeCache.set(r.id, r);
            }
          } else if (toolCall.function.name === 'search_all_recipes') {
            await publishProgress(jobId, {
              jobId,
              stage: 'searching_all',
              progress: 40 + attempts * 5,
              message: `Searching all recipes for "${args.query}"...`,
            });

            results = await searchAllRecipes(args.query);

            // Cache results
            for (const r of results) {
              recipeCache.set(r.id, r);
            }
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(results),
          });
        }

        await job.updateProgress(Math.min(70, 20 + attempts * 10));
      } else if (message.content) {
        // No tool calls, try to parse the response as final meal plan
        try {
          // Extract JSON from the response
          const jsonMatch = message.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            mealPlanResponse = JSON.parse(jsonMatch[0]) as MealPlanResponse;
            break;
          }
        } catch {
          // Continue if parsing fails
        }

        // If we couldn't parse, add the message and continue
        messages.push(message);
        messages.push({
          role: 'user',
          content:
            'Please provide the final meal plan as a JSON object with "now", "next", and "later" properties.',
        });
      }
    }

    if (!mealPlanResponse) {
      throw new Error('Failed to generate meal plan after maximum attempts');
    }

    // Stage 3: Planning complete
    await publishProgress(jobId, {
      jobId,
      stage: 'planning',
      progress: 80,
      message: 'Finalizing meal plan...',
    });

    await job.updateProgress(80);

    // Build the final meal plan with cached recipe data
    const buildRecipe = (
      slot: MealPlanResponse['now'],
      cached: RecipeSearchResult | undefined
    ): MealPlanRecipe => ({
      recipeId: slot.recipeId,
      title: slot.title,
      reasoning: slot.reasoning,
      matchedIngredients: slot.matchedIngredients,
      missingIngredients: slot.missingIngredients,
      fromSavedRecipes: cached?.fromSaved ?? false,
      imageUrl: cached?.imageUrl ?? undefined,
      prepTime: cached?.prepTime ?? undefined,
      cookTime: cached?.cookTime ?? undefined,
    });

    const mealPlan: MealPlan = {
      now: buildRecipe(mealPlanResponse.now, recipeCache.get(mealPlanResponse.now.recipeId)),
      next: buildRecipe(mealPlanResponse.next, recipeCache.get(mealPlanResponse.next.recipeId)),
      later: buildRecipe(mealPlanResponse.later, recipeCache.get(mealPlanResponse.later.recipeId)),
    };

    // Stage 4: Completed
    await publishProgress(jobId, {
      jobId,
      stage: 'completed',
      progress: 100,
      message: 'Meal plan ready!',
      mealPlan,
    });

    await job.updateProgress(100);

    // Publish job completed event
    await pubsub.publish(CHANNELS.job(jobId), {
      eventType: 'completed',
      result: { mealPlan },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await publishProgress(jobId, {
      jobId,
      stage: 'failed',
      progress: 0,
      message: 'Failed to generate meal plan',
      error: errorMessage,
    });

    await pubsub.publish(CHANNELS.job(jobId), {
      eventType: 'failed',
      error: errorMessage,
    });

    throw error;
  }
}
