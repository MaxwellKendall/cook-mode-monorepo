export type JobOperationType =
  | 'recipe.extract'
  | 'voice.track'
  | 'ingredient.parse'
  | 'mealplan.generate';

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
  userId: string;
}

export interface MealPlanPreferences {
  cuisinePreferences?: string[];
  dietaryRestrictions?: string[];
  maxCookTime?: number;
}

export interface MealPlanGeneratePayload {
  userId: string;
  ingredients: string[];
  preferences?: MealPlanPreferences;
}

export type JobPayload =
  | RecipeExtractPayload
  | VoiceTrackPayload
  | IngredientParsePayload
  | MealPlanGeneratePayload;

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
