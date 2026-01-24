export interface RecipeContext {
  id?: string;
  title?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  difficulty?: string;
  cuisine?: string;
  nutrients?: Record<string, string>;
}

export interface RealtimeSessionConfig {
  type: 'realtime';
  model: string;
  audio?: {
    output?: {
      voice?: string;
    };
  };
  instructions?: string;
  tools?: unknown[];
}

const extractNutrientValue = (raw: string, descriptor: string): string | null => {
  const parts = raw ? raw.split(' ') : [];
  if (!descriptor) return null;
  if (parts.length >= 2) {
    return `${parts[0]}${parts[1]} ${descriptor}`;
  }
  return null;
};

export const buildInstructions = (recipe?: RecipeContext): string => {
  if (!recipe) {
    return 'You are a helpful cooking assistant. Be concise and brief in all responses.';
  }

  const nutrientDescriptors: Record<string, string> = {
    calories: 'cal',
    proteinContent: 'protein',
    carbohydrateContent: 'carbs',
    fatContent: 'fat',
    fiberContent: 'fiber',
    sugarContent: 'sugar',
    sodiumContent: 'sodium',
    cholesterolContent: 'cholesterol',
    saturatedFatContent: 'saturated fat',
    unsaturatedFatContent: 'unsaturated fat',
  };

  const nutrients = recipe.nutrients
    ? Object.entries(recipe.nutrients)
        .map(([key, value]) => extractNutrientValue(value, nutrientDescriptors[key]))
        .filter((value): value is string => value !== null)
        .join(', ')
    : 'No nutrients available';

  return `You are a hands-free cooking assistant. Your role is to guide the user step-by-step through cooking a specific recipe.

Recipe Context:
- Recipe ID: ${recipe.id || 'Unknown'}
- Recipe Title: ${recipe.title || 'Unknown'}
- Recipe Description: ${recipe.description || 'No description available'}
- Recipe Ingredients: ${recipe.ingredients?.join(', ') || 'No ingredients available'}
- Recipe Instructions: ${recipe.instructions?.join(', ') || 'No instructions available'}
- Recipe Prep Time: ${recipe.prepTime || 'No prep time available'}
- Recipe Cook Time: ${recipe.cookTime || 'No cook time available'}
- Recipe Servings: ${recipe.servings || 'No servings available'}
- Recipe Difficulty: ${recipe.difficulty || 'No difficulty available'}
- Recipe Cuisine: ${recipe.cuisine || 'No cuisine available'}
- Recipe Nutrients: ${nutrients}

Your Goals:
- Help the user understand and prepare the recipe one step at a time
- Be conversational and adaptive (repeat, clarify, or simplify instructions when asked)
- Track progress through the recipe, remembering which step the user is on
- Offer practical cooking tips (timing cues, substitutions, safety reminders) where useful
- Only reference the current recipe; do not suggest unrelated recipes unless explicitly asked

IMPORTANT: Be concise and brief. Keep responses short and to the point. Avoid lengthy explanations or unnecessary details. This is a voice conversation - users want quick, actionable guidance, not verbose commentary.`;
};

export const getToolsConfig = (): unknown[] => {
  return [
    {
      type: 'function',
      name: 'search_recipes',
      description: 'Search for recipes using natural language queries with vector similarity',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natural language description of recipes to find',
          },
        },
        required: ['query'],
      },
    },
    {
      type: 'function',
      name: 'get_recipe_by_id',
      description: 'Get detailed information about a specific recipe by its ID',
      parameters: {
        type: 'object',
        properties: {
          recipe_id: {
            type: 'string',
            description: 'The unique identifier of the recipe',
          },
        },
        required: ['recipe_id'],
      },
    },
    {
      type: 'function',
      name: 'get_similar_recipes',
      description: 'Find recipes similar to a specific recipe using vector similarity',
      parameters: {
        type: 'object',
        properties: {
          recipe_id: {
            type: 'string',
            description: 'The unique identifier of the recipe to find similar recipes for',
          },
        },
        required: ['recipe_id'],
      },
    },
  ];
};

export const buildSessionConfig = (recipe?: RecipeContext): RealtimeSessionConfig => {
  return {
    type: 'realtime',
    model: 'gpt-4o-realtime-preview-2024-12-17',
    audio: {
      output: {
        voice: 'marin',
      },
    },
    instructions: buildInstructions(recipe),
    tools: getToolsConfig(),
  };
};
