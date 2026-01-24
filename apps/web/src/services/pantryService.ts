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

/**
 * Start ingredient parsing job
 */
export async function parseIngredients(
  imageUrl: string,
  userId: string
): Promise<CreateJobResponse> {
  try {
    const response = await fetch(`${API_URL}/pantry/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl, userId }),
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
