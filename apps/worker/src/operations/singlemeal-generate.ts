import type { Job } from '@cook-mode/redis';
import { createPubSub, CHANNELS } from '@cook-mode/redis';
import { openaiConfig } from '@cook-mode/config';
import { getUserSavedRecipes, getRecipeById } from '@cook-mode/db';
import { searchByText, textToVector } from '@cook-mode/vector';
import type {
  JobMessage,
  SingleMealGeneratePayload,
  SingleMealProgressMessage,
  SingleMealResult,
} from '@cook-mode/shared';
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

const pubsub = createPubSub();

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: openaiConfig.apiKey });
  }
  return openai;
}

async function publishProgress(
  jobId: string,
  progress: SingleMealProgressMessage
): Promise<void> {
  await pubsub.publish(
    CHANNELS.singlemeal(jobId),
    progress as unknown as Record<string, unknown>
  );
}

interface RecipeSearchResult {
  id: string;
  title: string;
  ingredients: string[];
  summary?: string | null;
  cookTime?: string | null;
  imageUrl?: string | null;
  fromSaved: boolean;
}

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_saved_recipes',
      description:
        "Search the user's saved recipe collection. Saved recipes are preferred when they match the user's preferences well.",
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find recipes (e.g., "quick chicken dinner", "vegetarian pasta")',
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
      description: 'Search the entire recipe database to find dinner recipes matching preferences.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find recipes (e.g., "quick chicken dinner", "vegetarian pasta")',
          },
        },
        required: ['query'],
      },
    },
  },
];

async function searchSavedRecipes(
  userId: string,
  query: string
): Promise<RecipeSearchResult[]> {
  const result = await getUserSavedRecipes(userId, 1, 100, false);
  const lowerQuery = query.toLowerCase();
  const queryTerms = lowerQuery.split(/\s+/);

  const parseIngredients = (ingredients: string | string[] | null | undefined): string[] => {
    if (!ingredients) return [];
    if (Array.isArray(ingredients)) return ingredients;
    try {
      const parsed = JSON.parse(ingredients);
      return Array.isArray(parsed) ? parsed : [ingredients];
    } catch {
      return ingredients.split('\n').filter(Boolean);
    }
  };

  return result.data
    .filter((recipe) => {
      const titleLower = recipe.title.toLowerCase();
      const ingredientsLower = parseIngredients(recipe.ingredients).join(' ').toLowerCase();
      const summaryLower = (recipe.summary || '').toLowerCase();
      return queryTerms.some(
        (term) =>
          titleLower.includes(term) ||
          ingredientsLower.includes(term) ||
          summaryLower.includes(term)
      );
    })
    .map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      ingredients: parseIngredients(recipe.ingredients),
      summary: recipe.summary ?? null,
      cookTime: recipe.cookTime ?? null,
      imageUrl: recipe.imageUrl ?? null,
      fromSaved: true,
    }))
    .slice(0, 10);
}

async function searchAllRecipes(query: string): Promise<RecipeSearchResult[]> {
  const results = await searchByText(query, textToVector, 10);
  return results.results.map((r) => ({
    id: r.payload.id,
    title: r.payload.title,
    ingredients: r.payload.ingredients || [],
    summary: r.payload.summary ?? null,
    cookTime: null,
    imageUrl: (r.payload.imageUrl as string | undefined) ?? null,
    fromSaved: false,
  }));
}

export async function processSingleMealGenerate(
  job: Job<JobMessage>
): Promise<void> {
  const { jobId, operation } = job.data;
  const payload = operation.payload as SingleMealGeneratePayload;
  const {
    servings = 2,
    dietary,
    freeText,
    excludeRecipeIds = [],
    userId,
    anonymousSessionId,
  } = payload;

  const isAnonymous = !userId;
  const recipeCache = new Map<string, RecipeSearchResult>();

  try {
    await publishProgress(jobId, {
      jobId,
      stage: 'finding_recipe',
      progress: 10,
      message: isAnonymous ? 'Finding the perfect recipe...' : 'Searching your saved recipes...',
    });
    await job.updateProgress(10);

    const client = getOpenAI();

    const availableTools = isAnonymous
      ? tools.filter((t) => t.function.name !== 'search_saved_recipes')
      : tools;

    const excludeClause =
      excludeRecipeIds.length > 0
        ? `\nDo NOT select any of these recipe IDs (already shown): ${excludeRecipeIds.join(', ')}`
        : '';

    const systemPrompt = `You are a dinner recommendation assistant. Select exactly 1 dinner recipe that best matches the user's preferences.

Guidelines:
1. Search recipes using the provided tools
2. For authenticated users, prefer saved recipes when they match well
3. Select the single best match — something the user would genuinely enjoy tonight
4. The recipe should serve approximately ${servings} people
${dietary.length ? `Dietary requirements: ${dietary.join(', ')}` : ''}
${freeText ? `User's request: ${freeText}` : ''}${excludeClause}

After searching, respond with a JSON object:
{
  "recipeId": "...",
  "title": "...",
  "reasoning": "Perfect for a quick weeknight dinner — ready in 25 minutes"
}

Keep the reasoning to 1 concise sentence that explains why this recipe is a great pick.`;

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Please find me a great dinner recipe${dietary.length ? ` that is ${dietary.join(', ')}` : ''}${freeText ? ` — ${freeText}` : ''}.`,
      },
    ];

    let attempts = 0;
    const maxAttempts = 8;
    let selection: { recipeId: string; title: string; reasoning: string } | null = null;

    while (attempts < maxAttempts) {
      attempts++;

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: availableTools,
        tool_choice: 'auto',
      });

      const message = response.choices[0]?.message;
      if (!message) throw new Error('No response from GPT-4o');

      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments) as { query: string };
          let results: RecipeSearchResult[] = [];

          if (toolCall.function.name === 'search_saved_recipes' && userId) {
            await publishProgress(jobId, {
              jobId,
              stage: 'finding_recipe',
              progress: Math.min(70, 20 + attempts * 10),
              message: `Searching saved recipes for "${args.query}"...`,
            });
            results = await searchSavedRecipes(userId, args.query);
            for (const r of results) recipeCache.set(r.id, r);
          } else if (toolCall.function.name === 'search_all_recipes') {
            await publishProgress(jobId, {
              jobId,
              stage: 'finding_recipe',
              progress: Math.min(70, 30 + attempts * 10),
              message: `Searching recipes for "${args.query}"...`,
            });
            results = await searchAllRecipes(args.query);
            for (const r of results) recipeCache.set(r.id, r);
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(results),
          });
        }

        await job.updateProgress(Math.min(75, 20 + attempts * 10));
      } else if (message.content) {
        try {
          const jsonMatch = message.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            selection = JSON.parse(jsonMatch[0]) as {
              recipeId: string;
              title: string;
              reasoning: string;
            };
            break;
          }
        } catch {
          // continue
        }

        messages.push(message);
        messages.push({
          role: 'user',
          content: 'Please provide the final selection as a JSON object with recipeId, title, and reasoning.',
        });
      }
    }

    if (!selection) {
      throw new Error('Failed to select a recipe after maximum attempts');
    }

    // Enrich with cook time from cache or DB
    const cached = recipeCache.get(selection.recipeId);
    let cookTime = 30; // default

    if (cached?.cookTime) {
      const parsed = parseInt(cached.cookTime, 10);
      if (!isNaN(parsed)) cookTime = parsed;
    } else {
      const dbRecipe = await getRecipeById(selection.recipeId);
      if (dbRecipe?.cookTime) {
        const parsed = typeof dbRecipe.cookTime === 'number'
          ? dbRecipe.cookTime
          : parseInt(String(dbRecipe.cookTime), 10);
        if (!isNaN(parsed)) cookTime = parsed;
      }
    }

    const thumbnail = cached?.imageUrl ?? undefined;

    const result: SingleMealResult = {
      recipe: {
        id: selection.recipeId,
        title: selection.title,
        cookTime,
        thumbnail,
      },
      reasoning: selection.reasoning,
    };

    await publishProgress(jobId, {
      jobId,
      stage: 'completed',
      progress: 100,
      message: 'Recipe found!',
      result,
    });
    await job.updateProgress(100);

    await pubsub.publish(CHANNELS.job(jobId), {
      eventType: 'completed',
      result: {
        ...result,
        userId,
        anonymousSessionId,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await publishProgress(jobId, {
      jobId,
      stage: 'failed',
      progress: 0,
      message: 'Failed to find a recipe',
      error: errorMessage,
    });

    await pubsub.publish(CHANNELS.job(jobId), {
      eventType: 'failed',
      error: errorMessage,
    });

    throw error;
  }
}
