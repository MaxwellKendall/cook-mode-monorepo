/**
 * Pantry Service
 *
 * API client for pantry/ingredient parsing and meal planning endpoints.
 */

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export interface ParsedIngredient {
  name: string;
  confidence: number;
  category?: string;
  quantity?: string;
}

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

export type MealPlanStatus = 'active' | 'completed';

export interface SavedMealPlan {
  id: string;
  userId: string;
  status: MealPlanStatus;
  ingredients: string[];
  plan: MealPlan;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateJobResponse {
  success: boolean;
  data?: {
    jobId: string;
    status: string;
    operation: string;
  };
  error?: string;
}

export interface MealPlanPreferences {
  cuisinePreferences?: string[];
  dietaryRestrictions?: string[];
  maxCookTime?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Start ingredient parsing job (supports multiple images)
 */
export async function parseIngredients(
  imageUrls: string[],
  userId: string
): Promise<CreateJobResponse> {
  try {
    const response = await fetch(`${API_URL}/pantry/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrls, userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error parsing ingredients:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse ingredients',
    };
  }
}

/**
 * Start meal plan generation job
 */
export async function generateMealPlan(
  userId: string,
  ingredients: string[],
  preferences?: MealPlanPreferences
): Promise<CreateJobResponse> {
  try {
    const response = await fetch(`${API_URL}/pantry/mealplan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ingredients, preferences }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate meal plan',
    };
  }
}

/**
 * Upload image to Supabase storage and get signed URL
 */
export async function uploadPantryImage(
  file: File,
  userId: string,
  supabase: any
): Promise<{ url: string } | { error: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('pantry-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get signed URL (24 hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('pantry-images')
      .createSignedUrl(data.path, 60 * 60 * 24);

    if (signedUrlError) {
      throw signedUrlError;
    }

    return { url: signedUrlData.signedUrl };
  } catch (error) {
    console.error('Error uploading pantry image:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

/**
 * Upload multiple images to Supabase storage and get signed URLs
 */
export async function uploadPantryImages(
  files: File[],
  userId: string,
  supabase: any
): Promise<{ urls: string[] } | { error: string }> {
  try {
    const urls: string[] = [];

    for (const file of files) {
      const result = await uploadPantryImage(file, userId, supabase);
      if ('error' in result) {
        throw new Error(result.error);
      }
      urls.push(result.url);
    }

    return { urls };
  } catch (error) {
    console.error('Error uploading pantry images:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to upload images',
    };
  }
}

/**
 * Save a meal plan to the database
 */
export async function saveMealPlan(
  userId: string,
  ingredients: string[],
  plan: MealPlan
): Promise<ApiResponse<SavedMealPlan>> {
  try {
    const response = await fetch(`${API_URL}/pantry/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, ingredients, plan }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving meal plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save meal plan',
    };
  }
}

/**
 * Get user's meal plans
 */
export async function getMealPlans(
  userId: string,
  status?: MealPlanStatus
): Promise<ApiResponse<SavedMealPlan[]>> {
  try {
    const params = new URLSearchParams({ userId });
    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`${API_URL}/pantry/plans?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch meal plans',
    };
  }
}

/**
 * Get a single meal plan by ID
 */
export async function getMealPlanById(
  planId: string,
  userId: string
): Promise<ApiResponse<SavedMealPlan>> {
  try {
    const params = new URLSearchParams({ userId });

    const response = await fetch(`${API_URL}/pantry/plans/${planId}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch meal plan',
    };
  }
}

/**
 * Update meal plan status
 */
export async function updateMealPlanStatus(
  planId: string,
  userId: string,
  status: MealPlanStatus
): Promise<ApiResponse<SavedMealPlan>> {
  try {
    const response = await fetch(`${API_URL}/pantry/plans/${planId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, status }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating meal plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update meal plan',
    };
  }
}

/**
 * Delete a meal plan
 */
export async function deleteMealPlan(
  planId: string,
  userId: string
): Promise<ApiResponse<void>> {
  try {
    const params = new URLSearchParams({ userId });

    const response = await fetch(`${API_URL}/pantry/plans/${planId}?${params}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete meal plan',
    };
  }
}
