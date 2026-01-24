import { tool } from '@openai/agents-realtime'
import { z } from 'zod'
import { searchRecipes } from '../services/recipeService'

// Base URL for our MCP server endpoints
const MCP_BASE_URL = import.meta.env?.VITE_MCP_BASE_URL || 'http://localhost:8000'
// Base URL for our API endpoints
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000'

// Helper function to make HTTP requests to our MCP endpoints
async function callMcpEndpoint(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`${MCP_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error calling MCP endpoint ${endpoint}:`, error)
    throw error
  }
}

// Helper function to make HTTP requests to our API endpoints
async function callApiEndpoint(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error calling API endpoint ${endpoint}:`, error)
    throw error
  }
}

// Tool to search for recipes using natural language queries
export const searchRecipesTool = tool({
  name: 'search_recipes',
  description: 'Search for recipes using natural language queries with vector similarity',
  parameters: z.object({
    query: z.string().describe('Natural language description of recipes to find (e.g., "chicken pasta", "vegetarian dinner", "quick breakfast")')
  }),
  async execute({ query }) {
    try {
      const recipe = await searchRecipes(query)
      return recipe.success ? recipe.data : []
    } catch (error) {
      console.error('Error searching recipes:', error)
      return []
    }
  }
})

// Tool to get detailed recipe information by ID
export const getRecipeByIdTool = tool({
  name: 'get_recipe_by_id',
  description: 'Get detailed information about a specific recipe by its ID',
  parameters: z.object({
    recipe_id: z.string().describe('The unique identifier of the recipe')
  }),
  async execute({ recipe_id }) {
    try {
      const data = await callMcpEndpoint(`/recipe/${recipe_id}`)
      return data.success ? data.recipe : null
    } catch (error) {
      console.error('Error getting recipe:', error)
      return null
    }
  }
})

// Tool to find recipes similar to a specific recipe
export const getSimilarRecipesTool = tool({
  name: 'get_similar_recipes',
  description: 'Find recipes similar to a specific recipe using vector similarity',
  parameters: z.object({
    recipe_id: z.string().describe('The unique identifier of the recipe to find similar recipes for')
  }),
  async execute({ recipe_id }) {
    try {
      const data = await callApiEndpoint('/recipes/similar', {
        method: 'POST',
        body: JSON.stringify({ recipeId: recipe_id })
      })
      return data.success ? data.data?.data || [] : []
    } catch (error) {
      console.error('Error getting similar recipes:', error)
      return []
    }
  }
})

// Tool to find recipes similar to a recipe from a web URL
export const findSimilarRecipesFromUrlTool = tool({
  name: 'find_similar_recipes_from_url',
  description: 'Find recipes similar to a recipe from a web URL using vector similarity',
  parameters: z.object({
    recipe_url: z.string().describe('The URL of the recipe to find similar recipes for')
  }),
  async execute({ recipe_url }) {
    try {
      const data = await callMcpEndpoint('/similar-recipes-from-url', {
        method: 'POST',
        body: JSON.stringify({ recipe_url })
      })
      return data.success ? data.similar_recipes : []
    } catch (error) {
      console.error('Error finding similar recipes from URL:', error)
      return []
    }
  }
})

// Tool to extract and store a recipe from a web URL
export const extractRecipeTool = tool({
  name: 'extract_and_store_recipe',
  description: 'Extract recipe information from a web URL and store it in the database',
  parameters: z.object({
    recipe_url: z.string().describe('The URL of the webpage containing the recipe to extract')
  }),
  async execute({ recipe_url }) {
    try {
      const data = await callMcpEndpoint('/extract-and-store-recipe', {
        method: 'POST',
        body: JSON.stringify({ recipe_url })
      })
      return data.success ? data.recipe : null
    } catch (error) {
      console.error('Error extracting recipe:', error)
      return null
    }
  }
})

// Export all tools as an array for easy use
export const allRealtimeTools = [
  searchRecipesTool,
  getRecipeByIdTool,
  getSimilarRecipesTool,
  findSimilarRecipesFromUrlTool,
  extractRecipeTool
]
