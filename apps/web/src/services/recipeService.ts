/**
 * Recipe Service
 * 
 * Type-safe API client for recipe endpoints.
 * Uses canonical types from api.ts - no transformation logic here.
 */

import {
  RecipeBase,
  RecipeFull,
  RecipeWithUserData,
  RecipeDetailResponse,
  RecipeSearchResponse,
  ApiResponse
} from '../types/api'

// Recipe extraction (legacy endpoint, different format)
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

// Re-export canonical types for convenience
export type RecipeByIdResponse = RecipeDetailResponse
export type { RecipeSearchResponse }

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';
const EXTRACTION_SERVICE_API_URL = import.meta.env?.VITE_EXTRACTION_SERVICE_API_URL || 'http://localhost:8001';
export const extractRecipe = async (url: string): Promise<RecipeExtractionResponse> => {
  try {
    const response = await fetch(`${EXTRACTION_SERVICE_API_URL}/extract-and-store-recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error extracting recipe:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract recipe'
    }
  }
}

/**
 * Get recipe by ID
 * Returns canonical RecipeDetailResponse from backend
 * No transformation needed - backend returns correct shape
 */
export const getRecipeById = async (recipeId: string, userId?: string): Promise<RecipeDetailResponse> => {
  try {
    const params = new URLSearchParams()
    if (userId) {
      params.append('user_id', userId)
    }

    const response = await fetch(`${API_URL}/recipes/${recipeId}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          data: null as any,
          error: 'Recipe not found'
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Backend now returns canonical RecipeDetailResponse
    const data: RecipeDetailResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching recipe:', error)
    return {
      success: false,
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to fetch recipe'
    }
  }
}

/**
 * Search recipes
 * Returns canonical RecipeSearchResponse from backend
 * No transformation needed - backend returns correct shape
 */
export const searchRecipes = async (query: string, userId?: string): Promise<RecipeSearchResponse> => {
  try {
    const requestBody: any = { query }
    if (userId) {
      requestBody.user_id = userId
    }

    const response = await fetch(`${API_URL}/recipes/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Backend now returns canonical RecipeSearchResponse
    const data: RecipeSearchResponse = await response.json()
    return data || { success: false, error: 'No data received' }
  } catch (error) {
    console.error('Error searching recipes:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to search recipes'
    }
  }
}

// User Recipe Management Interfaces
export interface SaveRecipeResponse {
  success: boolean
  message?: string
  error?: string
}

export interface UserSavedRecipesResponse {
  success: boolean
  data?: Array<{
    _id: string
    title: string
    description?: string
    ingredients: string[]
    instructions: string[]
    prepTime?: string
    cookTime?: string
    totalTime?: string
    servings?: string
    difficulty?: string
    cuisine?: string
    tags?: string[]
    image_url?: string
    link?: string
    summary?: string
    category?: string
    difficulty_level?: number
    prep_time?: number
    cook_time?: number
    saved_at?: string
  }>
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  error?: string
}

// User Recipe Management Functions
export const saveRecipeForUser = async (userId: string, recipeId: string): Promise<SaveRecipeResponse> => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/recipe/${recipeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error saving recipe for user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save recipe'
    }
  }
}

export const getUserSavedRecipes = async (
  userId: string, 
  page: number = 1, 
  limit: number = 20,
  favoriteOnly: boolean = false,
  withNotes: boolean = false,
  tagIds?: string[]
): Promise<UserSavedRecipesResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      favorite_only: favoriteOnly.toString(),
      with_notes: withNotes.toString()
    })
    
    // Add tag filtering parameter
    if (tagIds && tagIds.length > 0) {
      params.append('tag_ids', tagIds.join(','))
    }
    
    const response = await fetch(`${API_URL}/user/${userId}/recipes?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error getting user saved recipes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get saved recipes'
    }
  }
}

export const removeSavedRecipe = async (userId: string, recipeId: string): Promise<SaveRecipeResponse> => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/recipe/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error removing saved recipe:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove saved recipe'
    }
  }
}

export const getUserRecipe = async (userId: string, recipeId: string): Promise<RecipeByIdResponse> => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/recipe/${recipeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          data: null as any,
          error: 'Recipe not found in user\'s saved recipes'
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error getting user recipe:', error)
    return {
      success: false,
      data: null as any,
      error: error instanceof Error ? error.message : 'Failed to get user recipe'
    }
  }
}

export const isRecipeSavedForUser = async (userId: string, recipeId: string): Promise<{ is_saved: boolean }> => {
  try {
    const response = await fetch(`${API_URL}/user/${userId}/recipe/${recipeId}/saved`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const { data } = await response.json()
    return data;
  } catch (error) {
    console.error('Error checking if recipe is saved:', error)
    return { is_saved: false };
  }
}

