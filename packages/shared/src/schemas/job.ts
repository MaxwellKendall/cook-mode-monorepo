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
  imageUrls: z.array(z.string().url()).min(1),
  userId: z.string().uuid().optional(),
  anonymousSessionId: z.string().optional(),
});

export const MealPlanPreferencesSchema = z.object({
  cuisinePreferences: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  maxCookTime: z.number().int().positive().optional(),
  additionalInstructions: z.string().optional(),
});

export const MealPlanGeneratePayloadSchema = z.object({
  userId: z.string().uuid().optional(),
  anonymousSessionId: z.string().optional(),
  ingredients: z.array(z.string()).min(1),
  preferences: MealPlanPreferencesSchema.optional(),
});

export const ParsedIngredientSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(1),
  category: z.string().optional(),
  quantity: z.string().optional(),
});

export const WeeklyPlanPreferencesSchema = z.object({
  servings: z.number().int().min(1).max(8),
  numDinners: z.number().int().min(3).max(7),
  dietary: z.array(z.string()),
  freeText: z.string().optional(),
});

export const WeeklyPlanGeneratePayloadSchema = z.object({
  userId: z.string().uuid().optional(),
  anonymousSessionId: z.string().optional(),
  preferences: WeeklyPlanPreferencesSchema,
});

export const WeeklyPlanMealSchema = z.object({
  day: z.number().int().min(1).max(7),
  recipeId: z.string().uuid(),
  title: z.string(),
  imageUrl: z.string().url().optional(),
  prepTime: z.number().int().nonnegative().optional(),
  cookTime: z.number().int().nonnegative().optional(),
});

export const GroceryItemCategorySchema = z.enum([
  'produce',
  'meat_seafood',
  'dairy',
  'pantry',
  'frozen',
  'bakery',
  'other',
]);

export const GroceryItemAttributionSchema = z.object({
  recipeId: z.string().uuid(),
  title: z.string(),
  day: z.number().int().min(1).max(7),
});

export const GroceryItemSchema = z.object({
  name: z.string(),
  quantity: z.string(),
  category: GroceryItemCategorySchema,
  recipeAttributions: z.array(GroceryItemAttributionSchema),
});

export const WeeklyPlanResultSchema = z.object({
  meals: z.array(WeeklyPlanMealSchema),
  groceryItems: z.array(GroceryItemSchema),
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
  z.object({
    type: z.literal('weeklyplan.generate'),
    payload: WeeklyPlanGeneratePayloadSchema,
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
