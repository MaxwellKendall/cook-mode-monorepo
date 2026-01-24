export interface UserTag {
  id: string
  userId: string
  name: string
  color?: string
  createdAt: Date
  updatedAt: Date
  usage_count?: number
}

export interface TagResponse {
  success: boolean
  data?: UserTag[]
  error?: string
}

export interface CreateTagResponse {
  success: boolean
  data?: UserTag
  error?: string
}

export interface ApplyTagResponse {
  success: boolean
  data?: {
    id: string
    userId: string
    recipeId: string
    tagId: string
    appliedAt: Date
  }
  error?: string
}

export interface CreateTagAndApplyResponse {
  success: boolean
  data?: {
    tag: UserTag
    recipeTag: {
      id: string
      userId: string
      recipeId: string
      tagId: string
      appliedAt: Date
    }
  }
  error?: string
}

const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:8000';

// Get user's tags
export const getUserTags = async (userId: string, includeUsageCount: boolean = true): Promise<TagResponse> => {
  try {
    const params = new URLSearchParams({
      include_usage_count: includeUsageCount.toString(),
      user_id: userId
    });
    
    const response = await fetch(`${API_URL}/tag?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting user tags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user tags'
    };
  }
};

// Create a new tag
export const createUserTag = async (userId: string, name: string, color?: string): Promise<CreateTagResponse> => {
  try {
    const response = await fetch(`${API_URL}/tag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, name, color }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating user tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user tag'
    };
  }
};

// Apply tag to recipe
export const applyTagToRecipe = async (userId: string, recipeId: string, tagId: string): Promise<ApplyTagResponse> => {
  try {
    const response = await fetch(`${API_URL}/tag/${tagId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipe_id: recipeId,
        user_id: userId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error applying tag to recipe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply tag to recipe'
    };
  }
};

// Create tag and apply to recipe in one operation
export const createUserTagAndApplyToRecipe = async (userId: string, recipeId: string, name: string, color?: string): Promise<CreateTagAndApplyResponse> => {
  try {
    const response = await fetch(`${API_URL}/tag/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, recipe_id: recipeId, name, color }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating and applying tag to recipe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create and apply tag to recipe'
    };
  }
};

// Remove tag from recipe
export const removeTagFromRecipe = async (userId: string, recipeId: string, tagId: string, usageCount?: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/tag/${tagId}/recipe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        recipe_id: recipeId,
        ...(usageCount !== undefined && { usage_count: usageCount })
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing tag from recipe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove tag from recipe'
    };
  }
};

// Delete tag completely (removes from all recipes)
export const deleteUserTag = async (userId: string, tagId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/tag/${tagId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete tag'
    };
  }
};

// Helper function to format hashtag names
export const formatHashtagName = (name: string): string => {
  // Remove any existing # and clean the name
  const cleaned = name.replace(/^#+/, '').trim();
  // Ensure it starts with # and is lowercase
  return `#${cleaned.toLowerCase()}`;
};

// Helper function to validate hashtag name
export const isValidHashtagName = (name: string): boolean => {
  const cleaned = name.replace(/^#+/, '').trim();
  // Must be 1-30 characters, alphanumeric and underscores only
  return /^[a-zA-Z0-9_-]{1,30}$/.test(cleaned);
};
