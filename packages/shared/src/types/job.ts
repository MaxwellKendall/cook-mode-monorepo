export type JobOperationType =
  | 'recipe.extract'
  | 'voice.track'
  | 'ingredient.parse'
  | 'mealplan.generate'
  | 'weeklyplan.generate'
  | 'singlemeal.generate';

export interface RecipeExtractPayload {
  url: string;
  userId?: string;
}

export interface VoiceTrackPayload {
  userId: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
}

export interface IngredientParsePayload {
  imageUrls: string[];
  userId?: string;
  anonymousSessionId?: string;
}

export interface MealPlanPreferences {
  cuisinePreferences?: string[];
  dietaryRestrictions?: string[];
  maxCookTime?: number;
  additionalInstructions?: string;
}

export interface MealPlanGeneratePayload {
  userId?: string;
  anonymousSessionId?: string;
  ingredients: string[];
  preferences?: MealPlanPreferences;
}

export interface WeeklyPlanPreferences {
  servings: number;
  numDinners: number;
  dietary: string[];
  freeText?: string;
}

export interface WeeklyPlanGeneratePayload {
  userId?: string;
  anonymousSessionId?: string;
  preferences: WeeklyPlanPreferences;
}

export interface SingleMealGeneratePayload {
  servings?: number;
  dietary: string[];
  freeText?: string;
  excludeRecipeIds?: string[];
  userId?: string;
  anonymousSessionId?: string;
}

export interface SingleMealRecipe {
  id: string;
  title: string;
  cookTime: number;
  thumbnail?: string;
}

export interface SingleMealResult {
  recipe: SingleMealRecipe;
  reasoning: string;
}

export type SingleMealStage = 'finding_recipe' | 'completed' | 'failed';

export interface SingleMealProgressMessage {
  jobId: string;
  stage: SingleMealStage;
  progress: number;
  message?: string;
  result?: SingleMealResult;
  error?: string;
}

export type JobPayload =
  | RecipeExtractPayload
  | VoiceTrackPayload
  | IngredientParsePayload
  | MealPlanGeneratePayload
  | WeeklyPlanGeneratePayload
  | SingleMealGeneratePayload;

export interface JobOperation {
  type: JobOperationType;
  payload: JobPayload;
}

export interface JobMessage {
  jobId: string;
  operation: JobOperation;
  createdAt: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  operation: JobOperation;
  status: JobStatus;
  result?: unknown;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface JobEvent {
  id: string;
  jobId: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

export type RecipeExtractionStage =
  | 'extracting'
  | 'enriching'
  | 'embedding'
  | 'storing'
  | 'completed'
  | 'failed';

export interface RecipeProgressMessage {
  jobId: string;
  stage: RecipeExtractionStage;
  progress: number;
  message?: string;
  recipeId?: string;
  error?: string;
}

// Ingredient Parsing Types
export type IngredientParseStage =
  | 'analyzing'
  | 'extracting'
  | 'completed'
  | 'failed';

export interface ParsedIngredient {
  name: string;
  confidence: number;
  category?: string;
  quantity?: string;
}

export interface IngredientParseProgressMessage {
  jobId: string;
  stage: IngredientParseStage;
  progress: number;
  message?: string;
  ingredients?: ParsedIngredient[];
  error?: string;
}

// Meal Plan Types
export type MealPlanStage =
  | 'searching_saved'
  | 'searching_all'
  | 'planning'
  | 'completed'
  | 'failed';

export interface MealPlanRecipe {
  recipeId: string;
  title: string;
  reasoning: string;
  matchedIngredients: string[];
  missingIngredients: string[];
  fromSavedRecipes: boolean;
  imageUrl?: string;
  prepTime?: string;
  cookTime?: string;
}

export interface MealPlan {
  now: MealPlanRecipe;
  next: MealPlanRecipe;
  later: MealPlanRecipe;
}

export interface MealPlanProgressMessage {
  jobId: string;
  stage: MealPlanStage;
  progress: number;
  message?: string;
  mealPlan?: MealPlan;
  error?: string;
}

// Weekly Plan Types
export type WeeklyPlanStage =
  | 'finding_recipes'
  | 'building_plan'
  | 'creating_grocery_list'
  | 'completed'
  | 'failed';

export interface WeeklyPlanMeal {
  day: number;
  recipeId: string;
  title: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
}

export type GroceryItemCategory =
  | 'produce'
  | 'meat_seafood'
  | 'dairy'
  | 'pantry'
  | 'frozen'
  | 'bakery'
  | 'other';

export interface GroceryItemAttribution {
  recipeId: string;
  title: string;
  day: number;
}

export interface GroceryItem {
  name: string;
  quantity: string;
  category: GroceryItemCategory;
  recipeAttributions: GroceryItemAttribution[];
}

export interface WeeklyPlanResult {
  meals: WeeklyPlanMeal[];
  groceryItems: GroceryItem[];
}

export interface WeeklyPlanProgressMessage {
  jobId: string;
  stage: WeeklyPlanStage;
  progress: number;
  message?: string;
  weeklyPlan?: WeeklyPlanResult;
  error?: string;
}
