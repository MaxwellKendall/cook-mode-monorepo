const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export interface SingleMealPreferences {
  servings?: number;
  freeText?: string;
  dietary?: string[];
  excludeRecipeIds?: string[];
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

export interface CreateJobResponse {
  success: boolean;
  data?: { jobId: string; status: string; operation: string };
  error?: string;
}

export async function generateSingleMeal(
  preferences: SingleMealPreferences,
  options: { userId?: string; anonymousSessionId?: string } = {}
): Promise<CreateJobResponse> {
  try {
    const response = await fetch(`${API_URL}/single-meal/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dietary: [], ...preferences, ...options }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate meal',
    };
  }
}
