import type { RecipeBase, RecipeFull, RecipeWithUserData, PaginationMeta } from './recipe.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

export interface RecipeListResponse {
  success: boolean;
  data: RecipeBase[] | RecipeWithUserData[];
  pagination?: PaginationMeta;
  error?: string;
}

export interface RecipeDetailResponse {
  success: boolean;
  data: RecipeFull | RecipeWithUserData;
  error?: string;
}

export interface RecipeSearchResponse {
  success: boolean;
  data: RecipeBase[];
  total?: number;
  searchTimeMs?: number;
  error?: string;
}

export interface SearchParams {
  query: string;
  count?: number;
  filters?: Record<string, unknown>;
}

export interface SimilarRecipesParams {
  recipeId: string;
  count?: number;
}

export interface UserRecipeSaveParams {
  userId: string;
  recipeId: string;
  notes?: string;
  isFavorite?: boolean;
}

export interface UserTagParams {
  userId: string;
  name: string;
  color?: string;
}

export interface UserRecipeTagParams {
  userId: string;
  recipeId: string;
  tagId: string;
}
