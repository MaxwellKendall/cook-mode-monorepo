/**
 * Main types barrel file
 * 
 * Exports canonical types from api.ts as the primary source of truth.
 * Component prop interfaces come from recipe.ts (will be migrated).
 */

// ============================================================================
// Canonical API Types (PRIMARY - use these!)
// ============================================================================
export type {
  RecipeBase,
  RecipeFull,
  RecipeWithUserData,
  RecipeNutrients,
  UserTag,
  PaginationMeta,
  UserRecipeMetadata,
  ApiResponse,
  RecipeDetailResponse,
  RecipeSearchResponse,
  PaginatedRecipesResponse
} from './api'

// ============================================================================
// Component Prop Interfaces (LEGACY - will be migrated)
// ============================================================================
export type {
  RecipeDisplayProps,
  RecipeHeaderProps,
  RecipeImageProps,
  RecipeTagsProps,
  RecipeIngredientsProps,
  RecipeInstructionsProps,
  RecipeNutritionProps,
  RecipeGridProps,
  RecipeEntrySectionProps,
  RecipeExtractionRequest,
  RecipeExtractionResponse
} from './recipe'

// Global types (already defined in global.d.ts)
// These are available globally and don't need to be exported
