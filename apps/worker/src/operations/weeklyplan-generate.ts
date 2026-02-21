import type { Job } from '@cook-mode/redis';
import { createPubSub, CHANNELS } from '@cook-mode/redis';
import { openaiConfig } from '@cook-mode/config';
import {
  getUserSavedRecipes,
  getRecipeById,
  createWeeklyPlan,
  updateWeeklyPlanStatus,
  createGroceryList,
  bulkInsertItems,
} from '@cook-mode/db';
import { searchByText, textToVector } from '@cook-mode/vector';
import type {
  JobMessage,
  WeeklyPlanGeneratePayload,
  WeeklyPlanProgressMessage,
  WeeklyPlanMeal,
  GroceryItem,
  WeeklyPlanResult,
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
  progress: WeeklyPlanProgressMessage
): Promise<void> {
  await pubsub.publish(
    CHANNELS.weeklyplan(jobId),
    progress as unknown as Record<string, unknown>
  );
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
            description:
              'Search query to find recipes (e.g., "chicken pasta", "quick vegetarian dinner")',
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
        'Search the entire recipe database. Use this to find a wide variety of dinner recipes matching dietary preferences.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Search query to find recipes (e.g., "chicken pasta", "quick vegetarian dinner")',
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

  const parseIngredients = (
    ingredients: string | string[] | null | undefined
  ): string[] => {
    if (!ingredients) return [];
    if (Array.isArray(ingredients)) return ingredients;
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
      prepTime: recipe.prepTime ?? null,
      cookTime: recipe.cookTime ?? null,
      imageUrl: recipe.imageUrl ?? null,
      fromSaved: true,
    }))
    .slice(0, 10);

  return matches;
}

async function searchAllRecipes(
  query: string
): Promise<RecipeSearchResult[]> {
  const results = await searchByText(query, textToVector, 10);

  return results.results.map((r) => ({
    id: r.payload.id,
    title: r.payload.title,
    ingredients: r.payload.ingredients || [],
    summary: r.payload.summary ?? null,
    prepTime: null,
    cookTime: null,
    imageUrl: (r.payload.imageUrl as string | undefined) ?? null,
    fromSaved: false,
  }));
}

interface MealSelection {
  day: number;
  recipeId: string;
  title: string;
  reasoning: string;
}

interface GroceryListGPTItem {
  name: string;
  quantity: string;
  category: string;
  isPantryStaple: boolean;
  recipeAttributions: Array<{ recipeId: string; title: string; day: number }>;
}

export async function processWeeklyPlanGenerate(
  job: Job<JobMessage>
): Promise<void> {
  const { jobId, operation } = job.data;
  const payload = operation.payload as WeeklyPlanGeneratePayload;
  const { userId, anonymousSessionId, preferences } = payload;
  const { numDinners, servings, dietary, freeText } = preferences;

  const isAnonymous = !userId;
  const recipeCache = new Map<string, RecipeSearchResult>();

  try {
    // Create the weekly plan record in DB
    const weeklyPlan = await createWeeklyPlan({
      userId,
      anonymousSessionId,
      preferences,
    });

    // ── Phase 1: Recipe Selection ──────────────────────────────────
    await publishProgress(jobId, {
      jobId,
      stage: 'finding_recipes',
      progress: 5,
      message: isAnonymous
        ? 'Searching for dinner recipes...'
        : 'Searching your saved recipes...',
    });
    await job.updateProgress(5);

    const client = getOpenAI();

    const availableTools = isAnonymous
      ? tools.filter((t) => t.function.name !== 'search_saved_recipes')
      : tools;

    const systemPrompt = `You are a weekly dinner planning assistant. Select ${numDinners} varied dinner recipes for a weekly meal plan.

Guidelines:
1. Choose diverse recipes — vary proteins, cuisines, and cooking methods across the week
2. Search BOTH saved recipes and the full database to find the best matches
3. When preferences are similar, prefer saved recipes as a tiebreaker
4. Each recipe should serve approximately ${servings} people
5. Consider prep/cook times for a realistic weekly schedule — mix quick weeknight meals with longer weekend dishes

${dietary.length ? `Dietary requirements: ${dietary.join(', ')}` : ''}
${freeText ? `User's additional notes: ${freeText}` : ''}

After searching, respond with a JSON object:
{
  "meals": [
    { "day": 1, "recipeId": "...", "title": "...", "reasoning": "..." },
    { "day": 2, "recipeId": "...", "title": "...", "reasoning": "..." }
  ]
}

Days should be numbered 1 through ${numDinners}. Each recipe must be unique.`;

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Please create a ${numDinners}-dinner weekly plan${dietary.length ? ` that is ${dietary.join(', ')}` : ''}. Search for varied dinner recipes and select the best ${numDinners}.`,
      },
    ];

    let attempts = 0;
    const maxAttempts = 10;
    let mealsResponse: { meals: MealSelection[] } | null = null;

    while (attempts < maxAttempts) {
      attempts++;

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools: availableTools,
        tool_choice: 'auto',
      });

      const message = response.choices[0]?.message;
      if (!message) {
        throw new Error('No response from GPT-4o');
      }

      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          let results: RecipeSearchResult[] = [];

          if (toolCall.function.name === 'search_saved_recipes' && userId) {
            await publishProgress(jobId, {
              jobId,
              stage: 'finding_recipes',
              progress: Math.min(45, 10 + attempts * 5),
              message: `Searching saved recipes for "${args.query}"...`,
            });

            results = await searchSavedRecipes(userId, args.query);
            for (const r of results) {
              recipeCache.set(r.id, r);
            }
          } else if (toolCall.function.name === 'search_all_recipes') {
            await publishProgress(jobId, {
              jobId,
              stage: 'finding_recipes',
              progress: Math.min(45, 15 + attempts * 5),
              message: `Searching all recipes for "${args.query}"...`,
            });

            results = await searchAllRecipes(args.query);
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

        await job.updateProgress(Math.min(50, 10 + attempts * 5));
      } else if (message.content) {
        try {
          const jsonMatch = message.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            mealsResponse = JSON.parse(jsonMatch[0]) as {
              meals: MealSelection[];
            };
            break;
          }
        } catch {
          // Continue if parsing fails
        }

        messages.push(message);
        messages.push({
          role: 'user',
          content: `Please provide the final meal selections as a JSON object with a "meals" array containing ${numDinners} entries.`,
        });
      }
    }

    if (!mealsResponse || !mealsResponse.meals?.length) {
      throw new Error(
        'Failed to generate weekly plan after maximum attempts'
      );
    }

    // ── Persist Plan ───────────────────────────────────────────────
    await publishProgress(jobId, {
      jobId,
      stage: 'building_plan',
      progress: 55,
      message: 'Building your weekly plan...',
    });
    await job.updateProgress(55);

    // Enrich meals with cached data (imageUrl, prepTime, cookTime)
    const meals: WeeklyPlanMeal[] = await Promise.all(
      mealsResponse.meals.map(async (m) => {
        const cached = recipeCache.get(m.recipeId);
        // Try DB lookup if not in cache (for prepTime/cookTime as numbers)
        let dbRecipe: Awaited<ReturnType<typeof getRecipeById>> | null = null;
        if (!cached) {
          dbRecipe = await getRecipeById(m.recipeId);
        }

        const parseTime = (
          val: string | number | null | undefined
        ): number | undefined => {
          if (val == null) return undefined;
          if (typeof val === 'number') return val;
          const num = parseInt(val, 10);
          return isNaN(num) ? undefined : num;
        };

        return {
          day: m.day,
          recipeId: m.recipeId,
          title: m.title,
          imageUrl:
            cached?.imageUrl ?? dbRecipe?.imageUrl ?? undefined,
          prepTime: parseTime(
            cached?.prepTime ?? dbRecipe?.prepTime
          ),
          cookTime: parseTime(
            cached?.cookTime ?? dbRecipe?.cookTime
          ),
        };
      })
    );

    await updateWeeklyPlanStatus(weeklyPlan.id, 'active', meals);

    // ── Phase 2: Grocery List Generation ───────────────────────────
    await publishProgress(jobId, {
      jobId,
      stage: 'creating_grocery_list',
      progress: 65,
      message: 'Generating grocery list...',
    });
    await job.updateProgress(65);

    // Gather ingredient lists for all selected recipes
    const recipeIngredients: Array<{
      day: number;
      recipeId: string;
      title: string;
      ingredients: string[];
    }> = [];

    for (const meal of meals) {
      const cached = recipeCache.get(meal.recipeId);
      let ingredients = cached?.ingredients ?? [];

      // If no ingredients in cache, fetch from DB
      if (ingredients.length === 0) {
        const dbRecipe = await getRecipeById(meal.recipeId);
        if (dbRecipe?.ingredients) {
          if (typeof dbRecipe.ingredients === 'string') {
            try {
              const parsed = JSON.parse(dbRecipe.ingredients);
              ingredients = Array.isArray(parsed)
                ? parsed
                : dbRecipe.ingredients.split('\n').filter(Boolean);
            } catch {
              ingredients = dbRecipe.ingredients
                .split('\n')
                .filter(Boolean);
            }
          } else if (Array.isArray(dbRecipe.ingredients)) {
            ingredients = dbRecipe.ingredients;
          }
        }
      }

      recipeIngredients.push({
        day: meal.day,
        recipeId: meal.recipeId,
        title: meal.title,
        ingredients,
      });
    }

    const groceryPrompt = `You are a grocery list builder. Given the ingredient lists for ${numDinners} dinner recipes (each serving ${servings} people), create a consolidated grocery list.

Rules:
1. Merge duplicate ingredients across recipes and sum their quantities
2. Categorize each item into one of: produce, meat_seafood, dairy, pantry, frozen, bakery, other
3. For each item, track which recipes need it (recipeAttributions)
4. Mark common pantry staples (salt, pepper, oil, butter, sugar, flour, etc.) with isPantryStaple: true
5. Adjust quantities for ${servings} servings if the recipe serves a different amount

Here are the recipes and their ingredients:

${recipeIngredients.map((r) => `Day ${r.day} — ${r.title} (${r.recipeId}):\n${r.ingredients.map((i) => `  - ${i}`).join('\n')}`).join('\n\n')}

Respond with a JSON object:
{
  "items": [
    {
      "name": "chicken breast",
      "quantity": "2 lbs",
      "category": "meat_seafood",
      "isPantryStaple": false,
      "recipeAttributions": [{ "recipeId": "...", "title": "...", "day": 1 }]
    }
  ]
}`;

    const groceryResponse = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: groceryPrompt },
        {
          role: 'user',
          content: 'Generate the consolidated grocery list.',
        },
      ],
      response_format: { type: 'json_object' },
    });

    const groceryContent = groceryResponse.choices[0]?.message?.content;
    if (!groceryContent) {
      throw new Error('Failed to generate grocery list');
    }

    const groceryData = JSON.parse(groceryContent) as {
      items: GroceryListGPTItem[];
    };

    await publishProgress(jobId, {
      jobId,
      stage: 'creating_grocery_list',
      progress: 85,
      message: 'Saving grocery list...',
    });
    await job.updateProgress(85);

    // Create grocery list in DB
    const groceryList = await createGroceryList({
      weeklyPlanId: weeklyPlan.id,
      userId,
      anonymousSessionId,
    });

    // Bulk insert items — pantry staples get checked: true
    await bulkInsertItems(
      groceryData.items.map((item) => ({
        groceryListId: groceryList.id,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        recipeAttributions: item.recipeAttributions,
        checked: item.isPantryStaple,
      }))
    );

    // ── Completion ─────────────────────────────────────────────────
    const groceryItems: GroceryItem[] = groceryData.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category as GroceryItem['category'],
      recipeAttributions: item.recipeAttributions,
    }));

    const result: WeeklyPlanResult = { meals, groceryItems };

    await publishProgress(jobId, {
      jobId,
      stage: 'completed',
      progress: 100,
      message: 'Weekly plan ready!',
      weeklyPlan: result,
    });
    await job.updateProgress(100);

    await pubsub.publish(CHANNELS.job(jobId), {
      eventType: 'completed',
      result: {
        weeklyPlanId: weeklyPlan.id,
        groceryListId: groceryList.id,
        ...result,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await publishProgress(jobId, {
      jobId,
      stage: 'failed',
      progress: 0,
      message: 'Failed to generate weekly plan',
      error: errorMessage,
    });

    await pubsub.publish(CHANNELS.job(jobId), {
      eventType: 'failed',
      error: errorMessage,
    });

    throw error;
  }
}
