import { z } from 'zod';

export const RecipeExtractPayloadSchema = z.object({
  url: z.string().url(),
  userId: z.string().uuid().optional(),
});

export const VoiceTrackPayloadSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
});

export const IngredientParsePayloadSchema = z.object({
  imageUrl: z.string().url(),
  userId: z.string().uuid(),
});

export const MealPlanPreferencesSchema = z.object({
  cuisinePreferences: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  maxCookTime: z.number().int().positive().optional(),
});

export const MealPlanGeneratePayloadSchema = z.object({
  userId: z.string().uuid(),
  ingredients: z.array(z.string()).min(1),
  preferences: MealPlanPreferencesSchema.optional(),
});

export const ParsedIngredientSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(1),
  category: z.string().optional(),
  quantity: z.string().optional(),
});

export const MealPlanRecipeSchema = z.object({
  recipeId: z.string().uuid(),
  title: z.string(),
  reasoning: z.string(),
  matchedIngredients: z.array(z.string()),
  missingIngredients: z.array(z.string()),
  fromSavedRecipes: z.boolean(),
  imageUrl: z.string().url().optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
});

export const MealPlanSchema = z.object({
  now: MealPlanRecipeSchema,
  next: MealPlanRecipeSchema,
  later: MealPlanRecipeSchema,
});

export const JobOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('recipe.extract'),
    payload: RecipeExtractPayloadSchema,
  }),
  z.object({
    type: z.literal('voice.track'),
    payload: VoiceTrackPayloadSchema,
  }),
  z.object({
    type: z.literal('ingredient.parse'),
    payload: IngredientParsePayloadSchema,
  }),
  z.object({
    type: z.literal('mealplan.generate'),
    payload: MealPlanGeneratePayloadSchema,
  }),
]);

export const CreateJobRequestSchema = z.object({
  operation: JobOperationSchema,
});

export const JobMessageSchema = z.object({
  jobId: z.string().uuid(),
  operation: JobOperationSchema,
  createdAt: z.string().datetime(),
});

export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
