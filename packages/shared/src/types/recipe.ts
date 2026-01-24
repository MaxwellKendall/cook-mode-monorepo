/**
 * Canonical Recipe Types
 */

export interface RecipeNutrients {
  calories?: string;
  protein?: string;
  carbohydrates?: string;
  fat?: string;
  fiber?: string;
  sugar?: string;
  sodium?: string;
  cholesterol?: string;
  saturatedFat?: string;
  unsaturatedFat?: string;
}

export interface UserTag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RecipeBase {
  id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  cuisine?: string;
  category?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  rating?: number;
  ratingCount?: number;
  difficulty?: string;
  source?: string;
  link?: string;
}

export interface RecipeFull extends RecipeBase {
  ingredients: string[];
  instructions: string[];
  nutrients?: RecipeNutrients;
  tags?: string[];
  qualificationMethod?: string;
  qualified?: boolean;
  levelOfEffort?: number;
  vectorEmbedded?: boolean;
  vectorId?: string;
  newsletterEdition?: string;
  embeddingPrompt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeWithUserData extends RecipeFull {
  userTags: UserTag[];
  isSaved: boolean;
  savedAt?: string;
  notes?: string;
  isFavorite?: boolean;
}

export interface VectorRecipe {
  id: string;
  title: string;
  summary?: string;
  ingredients?: string[];
  cuisine?: string;
  category?: string;
  source?: string;
  link?: string;
  imageUrl?: string;
  rating?: number;
}
