const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export interface WeeklyPlanPreferences {
  servings: number;
  numDinners: number;
  dietary: string[];
  freeText?: string;
}

export interface WeeklyPlanMeal {
  day: number;
  recipeId: string;
  title: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  cookedAt?: string | null;
}

export type WeeklyPlanStatus = 'generating' | 'active' | 'completed';

export interface WeeklyPlan {
  id: string;
  userId?: string | null;
  anonymousSessionId?: string | null;
  status: WeeklyPlanStatus;
  preferences: WeeklyPlanPreferences;
  meals?: WeeklyPlanMeal[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobResponse {
  success: boolean;
  data?: { jobId: string; status: string; operation: string };
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function generateWeeklyPlan(
  preferences: WeeklyPlanPreferences,
  options: { userId?: string; anonymousSessionId?: string } = {}
): Promise<CreateJobResponse> {
  try {
    const response = await fetch(`${API_URL}/weekly-plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences, ...options }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate plan' };
  }
}

export async function saveWeeklyPlan(
  userId: string,
  anonymousSessionId: string,
  token?: string
): Promise<ApiResponse<{ claimed: number }>> {
  try {
    const response = await fetch(`${API_URL}/weekly-plans`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ userId, anonymousSessionId }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save plan' };
  }
}

export async function getWeeklyPlans(
  userId: string,
  status?: WeeklyPlanStatus,
  token?: string
): Promise<ApiResponse<WeeklyPlan[]>> {
  try {
    const params = new URLSearchParams({ userId });
    if (status) params.append('status', status);
    const response = await fetch(`${API_URL}/weekly-plans?${params}`, {
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch plans' };
  }
}

export async function getWeeklyPlan(id: string, token?: string): Promise<ApiResponse<WeeklyPlan>> {
  try {
    const response = await fetch(`${API_URL}/weekly-plans/${id}`, {
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch plan' };
  }
}

export async function markMealCooked(
  planId: string,
  day: number,
  token?: string
): Promise<ApiResponse<WeeklyPlan>> {
  try {
    const response = await fetch(`${API_URL}/weekly-plans/${planId}/meals/${day}`, {
      method: 'PATCH',
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to mark meal cooked' };
  }
}

export async function swapMeal(
  planId: string,
  day: number,
  token?: string
): Promise<CreateJobResponse> {
  try {
    const response = await fetch(`${API_URL}/weekly-plans/${planId}/swap`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ day }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to swap meal' };
  }
}

export async function deleteWeeklyPlan(id: string, token?: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_URL}/weekly-plans/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete plan' };
  }
}
