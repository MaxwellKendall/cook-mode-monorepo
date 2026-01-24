/**
 * LEGACY FILE - Component prop interfaces only
 * 
 * This file now contains only component prop interfaces for backwards compatibility.
 * All recipe data types should be imported from '../types/api' (canonical types).
 * 
 * TODO: Gradually migrate component props to use canonical types directly,
 * then this file can be removed entirely.
 */

import { UserTag, RecipeNutrients, RecipeBase, RecipeFull } from './api'

// ============================================================================
// Component Prop Interfaces
// ============================================================================

export interface RecipeDisplayProps {
  recipe: RecipeFull
  onBack: () => void
}

export interface RecipeHeaderProps {
  recipe: RecipeFull
  onBack: () => void
  onSave: () => void
  isSaved: boolean
  isSaveLoading: boolean
  showSaveButton: boolean
  userId?: string
  userTags?: UserTag[]
  userTagsLoading?: boolean
}

export interface RecipeImageProps {
  imageUrl?: string
  title?: string
}

export interface RecipeTagsProps {
  cuisine?: string
  difficulty?: string
  tags?: string[]
  userTags?: UserTag[]
}

export interface RecipeIngredientsProps {
  ingredients?: string[]
}

export interface RecipeInstructionsProps {
  instructions?: string[]
}

export interface RecipeNutritionProps {
  nutrients?: RecipeNutrients
}

export interface RecipeGridProps {
  recipes: RecipeBase[]
  title: string
  showClearButton?: boolean
  onClearResults?: () => void
  savedRecipes: RecipeBase[]
  onSaveClick: (e: React.MouseEvent, isSaved: boolean, recipe: RecipeBase) => void
  userTags: UserTag[]
  userTagsLoading?: boolean
  userId?: string
}

export interface RecipeEntrySectionProps {
  onSuccess: () => void
  onSearchResults: (recipes: RecipeBase[]) => void
  userId?: string
}

// ============================================================================
// Service Request/Response Interfaces
// ============================================================================

export interface RecipeExtractionRequest {
  url: string
}

export interface RecipeExtractionResponse {
  success: boolean
  recipe_id?: string
  title?: string
  link?: string
  summary?: string
  ingredients?: string[]
  instructions?: string[]
  cuisine?: string
  category?: string
  difficulty_level?: number
  servings?: number
  prep_time?: number
  cook_time?: number
  error?: string
}
