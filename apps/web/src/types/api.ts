/**
 * API Types - Frontend
 * 
 * These types mirror the backend canonical types from cook-mode-api/src/types/recipe.ts
 * They define the shape of data received from the API.
 * 
 * DO NOT create new types here - use these canonical types everywhere.
 * If you need a different shape for a component, create a transformation function.
 */

// Nutrition information (matches backend)
export interface RecipeNutrients {
  calories?: string
  protein?: string
  carbohydrates?: string
  fat?: string
  fiber?: string
  sugar?: string
  sodium?: string
  cholesterol?: string
  saturatedFat?: string
  unsaturatedFat?: string
}

// User tag (matches backend)
export interface UserTag {
  id: string
  userId: string
  name: string
  color?: string
  createdAt: Date
  updatedAt: Date
  usageCount?: number
}

// Pagination metadata (matches backend)
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * RecipeBase - Minimal recipe data for list views
 * Used in search results, recipe grids, etc.
 */
export interface RecipeBase {
  id: string
  title: string
  summary?: string
  imageUrl?: string
  cuisine?: string
  category?: string
  prepTime?: string
  cookTime?: string
  totalTime?: string
  servings?: string
  rating?: number
  ratingCount?: number
  difficulty?: string
  source?: string
  link?: string
}

/**
 * RecipeFull - Complete recipe data for detail views
 * Used on recipe detail pages
 */
export interface RecipeFull extends RecipeBase {
  ingredients: string[]      // Always array
  instructions: string[]     // Always array
  nutrients?: RecipeNutrients
  tags?: string[]           // System tags
  qualificationMethod?: string
  qualified?: boolean
  levelOfEffort?: number
  vectorEmbedded?: boolean
  vectorId?: string
  newsletterEdition?: string
  embeddingPrompt?: string
  createdAt: string         // ISO timestamp
  updatedAt: string         // ISO timestamp
}

/**
 * RecipeWithUserData - Recipe with user-specific metadata
 * Used for authenticated views (saved recipes, detail pages with user logged in)
 */
export interface RecipeWithUserData extends RecipeFull {
  userTags: UserTag[]       // User's custom tags
  isSaved: boolean
  savedAt?: string          // ISO timestamp
  notes?: string
  isFavorite?: boolean
}

/**
 * API Response Types
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface RecipeListResponse {
  success: boolean
  data: RecipeBase[] | RecipeWithUserData[]
  pagination?: PaginationMeta
  error?: string
}

export interface RecipeDetailResponse {
  success: boolean
  data: RecipeFull | RecipeWithUserData
  error?: string
}

export interface RecipeSearchResponse {
  success: boolean
  data: RecipeBase[]
  total?: number
  searchTimeMs?: number
  error?: string
}

/**
 * Legacy type aliases for backwards compatibility
 * TODO: Remove these once all components are updated
 */

// @deprecated Use RecipeWithUserData instead
export type Recipe = RecipeWithUserData

// @deprecated Use RecipeFull instead  
export type RecipeData = RecipeFull

