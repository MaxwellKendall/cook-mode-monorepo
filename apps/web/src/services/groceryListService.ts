const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

export interface GroceryItem {
  id: string;
  groceryListId: string;
  name: string;
  quantity?: string | null;
  category: string;
  checked: boolean;
  checkedAt?: string | null;
  isManualAdd: boolean;
  recipeAttributions: Array<{ recipeId: string; title: string; day: number }>;
}

export interface GrocerySection {
  category: string;
  label: string;
  items: GroceryItem[];
}

export interface GroceryListProgress {
  checked: number;
  total: number;
}

export interface GroceryList {
  id: string;
  weeklyPlanId: string;
  progress: GroceryListProgress;
  sections: GrocerySection[];
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

export async function getGroceryList(id: string, token?: string): Promise<ApiResponse<GroceryList>> {
  try {
    const response = await fetch(`${API_URL}/grocery-lists/${id}`, {
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch grocery list' };
  }
}

export async function getGroceryListByPlan(
  weeklyPlanId: string,
  token?: string
): Promise<ApiResponse<GroceryList>> {
  try {
    const response = await fetch(`${API_URL}/grocery-lists/by-plan/${weeklyPlanId}`, {
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch grocery list' };
  }
}

export async function toggleItem(
  listId: string,
  itemId: string,
  checked: boolean,
  token?: string
): Promise<ApiResponse<GroceryItem>> {
  try {
    const response = await fetch(`${API_URL}/grocery-lists/${listId}/items/${itemId}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ checked }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to toggle item' };
  }
}

export async function addItem(
  listId: string,
  item: { name: string; quantity?: string; category?: string },
  token?: string
): Promise<ApiResponse<GroceryItem>> {
  try {
    const response = await fetch(`${API_URL}/grocery-lists/${listId}/items`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add item' };
  }
}

export async function removeItem(
  listId: string,
  itemId: string,
  token?: string
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_URL}/grocery-lists/${listId}/items/${itemId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to remove item' };
  }
}
