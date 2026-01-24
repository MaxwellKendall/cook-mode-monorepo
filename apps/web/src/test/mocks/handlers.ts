/**
 * MSW (Mock Service Worker) handlers for integration tests
 * These intercept real API calls and return controlled responses
 */

import { http, HttpResponse } from 'msw'
import {
  createMockTagResponse,
  createMockCreateTagResponse,
  createMockApplyTagResponse,
  createMockCreateTagAndApplyResponse,
  createMockSuccessResponse,
} from './apiResponses'
import { createMockRecipeBase, createMockRecipeWithUserData, createMockUserTag } from './recipes'

const API_URL = process.env.VITE_API_URL || 'http://localhost:8000'
const SAVED_RECIPE_IDS = ['saved_recipe_id']

/**
 * MSW handlers for all API endpoints
 */
export const handlers = [
  // ===== TAG ENDPOINTS =====
  
  // GET /tag - Get user tags
  http.get(`${API_URL}/tag`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    const includeUsageCount = url.searchParams.get('include_usage_count')
    
    if (!userId) {
      return HttpResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json(createMockTagResponse())
  }),

  // POST /tag - Create new tag
  http.post(`${API_URL}/tag`, async ({ request }) => {
    const body = await request.json() as { user_id: string; name: string; color?: string }
    
    if (!body.user_id || !body.name) {
      return HttpResponse.json(
        { success: false, error: 'user_id and name are required' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json(createMockCreateTagResponse({
      data: {
        id: 'new-tag-id',
        userId: body.user_id,
        name: body.name,
        color: body.color || '#FF5733',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }))
  }),

  // PUT /tag/:tag_id - Update tag
  http.put(`${API_URL}/tag/:tag_id`, async ({ request, params }) => {
    const body = await request.json() as { user_id: string; name?: string; color?: string }
    const { tag_id } = params as { tag_id: string }
    
    if (!body.user_id || !tag_id) {
      return HttpResponse.json(
        { success: false, error: 'user_id and tag_id are required' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json(createMockCreateTagResponse({
      data: {
        id: tag_id,
        userId: body.user_id,
        name: body.name || 'Updated Tag',
        color: body.color,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }))
  }),

  // POST /tag/:tag_id/apply - Apply tag to recipe
  http.post(`${API_URL}/tag/:tag_id/apply`, async ({ request, params }) => {
    const body = await request.json() as { user_id: string; recipe_id: string }
    const { tag_id } = params as { tag_id: string }
    
    if (!body.user_id || !body.recipe_id || !tag_id) {
      return HttpResponse.json(
        { success: false, error: 'user_id, recipe_id, and tag_id are required' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json(createMockApplyTagResponse())
  }),

  // DELETE /tag/:tag_id/recipe - Remove tag from recipe
  http.delete(`${API_URL}/tag/:tag_id/recipe`, async ({ request, params }) => {
    const body = await request.json() as { user_id: string; recipe_id: string }
    const { tag_id } = params as { tag_id: string }
    
    if (!body.user_id || !body.recipe_id || !tag_id) {
      return HttpResponse.json(
        { success: false, error: 'user_id, recipe_id, and tag_id are required' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Tag removed from recipe successfully',
    })
  }),

  // DELETE /tag/:tag_id - Delete tag
  http.delete(`${API_URL}/tag/:tag_id`, async ({ request, params }) => {
    const body = await request.json() as { user_id: string }
    const { tag_id } = params as { tag_id: string }
    
    if (!body.user_id || !tag_id) {
      return HttpResponse.json(
        { success: false, error: 'user_id and tag_id are required' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Tag deleted successfully',
    })
  }),

  // POST /tag/apply - Create and apply tag
  http.post(`${API_URL}/tag/apply`, async ({ request }) => {
    const body = await request.json() as { 
      user_id: string; 
      recipe_id: string; 
      name: string; 
      color?: string 
    }
    
    if (!body.user_id || !body.recipe_id || !body.name) {
      return HttpResponse.json(
        { success: false, error: 'user_id, recipe_id, and name are required' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json(createMockCreateTagAndApplyResponse({
      data: {
        tag: createMockUserTag({ 
          id: `tag-${Date.now()}`, // Generate unique ID
          name: body.name,
          userId: body.user_id 
        }),
        recipeTag: {
          id: `recipe-tag-${Date.now()}`,
          userId: body.user_id,
          recipeId: body.recipe_id,
          tagId: `tag-${Date.now()}`,
          appliedAt: new Date(),
        },
      }
    }), { status: 201 })
  }),

  // ===== RECIPE ENDPOINTS =====
  
  // GET /recipes/:id - Get recipe by ID
  http.get(`${API_URL}/recipes/:id`, ({ params, request }) => {
    const { id } = params as { id: string }
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    
    if (!id) {
      return HttpResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      )
    }
    
    // Return recipe with user data if userId provided
    const recipe = userId 
      ? createMockRecipeWithUserData({ id })
      : createMockRecipeBase({ id })
    
    return HttpResponse.json({
      success: true,
      data: recipe,
    })
  }),

  // POST /recipes/search - Search recipes
  http.post(`${API_URL}/recipes/search`, async ({ request }) => {
    const body = await request.json() as { 
      query: string; 
      count?: number; 
      user_id?: string 
    }
    
    if (!body.query) {
      return HttpResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }
    
    // Simulate search filtering based on query
    const allRecipes = [
      createMockRecipeBase({ id: 'recipe1', title: 'Spaghetti Carbonara' }),
      createMockRecipeBase({ id: 'recipe2', title: 'Chicken Tikka Masala' }),
      createMockRecipeBase({ id: 'recipe3', title: 'Beef Stir Fry' }),
    ]
    
    const filtered = allRecipes.filter(recipe =>
      recipe.title.toLowerCase().includes(body.query.toLowerCase())
    )
    
    return HttpResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
      searchTimeMs: 50,
    })
  }),

  // POST /recipes/similar - Find similar recipes
  http.post(`${API_URL}/recipes/similar`, async ({ request }) => {
    const body = await request.json() as { 
      recipeId: string; 
      count?: number 
    }
    
    if (!body.recipeId) {
      return HttpResponse.json(
        { success: false, error: 'recipeId is required' },
        { status: 400 }
      )
    }
    
    // Return similar recipes
    const similarRecipes = [
      createMockRecipeBase({ id: 'similar1', title: 'Similar Recipe 1' }),
      createMockRecipeBase({ id: 'similar2', title: 'Similar Recipe 2' }),
    ]
    
    return HttpResponse.json({
      success: true,
      data: similarRecipes,
      total: similarRecipes.length,
      searchTimeMs: 30,
    })
  }),

  // ===== SAVED RECIPES ENDPOINTS =====
  
  // GET /user/:userId/recipes - Get user's saved recipes
  http.get(`${API_URL}/user/:userId/recipes`, ({ params }) => {
    const { userId } = params as { userId: string }
    
    if (!userId) {
      return HttpResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      )
    }
    
    const savedRecipes = [
      createMockRecipeBase({ id: 'recipe1', title: 'Spaghetti Carbonara' }),
      createMockRecipeBase({ id: 'recipe2', title: 'Chicken Tikka Masala' }),
    ]
    
    return HttpResponse.json({
      success: true,
      data: savedRecipes,
    })
  }),

  // POST /user/:userId/recipe/:recipeId - Save recipe for user
  http.post(`${API_URL}/user/:userId/recipe/:recipeId`, ({ params }) => {
    const { userId, recipeId } = params as { userId: string; recipeId: string }
    
    if (!userId || !recipeId) {
      return HttpResponse.json(
        { success: false, error: 'user_id and recipe_id are required' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      message: 'Recipe saved successfully',
    })
  }),

  // DELETE /user/:userId/recipe/:recipeId - Remove saved recipe
  http.delete(`${API_URL}/user/:userId/recipe/:recipeId`, ({ params }) => {
    const { userId, recipeId } = params as { userId: string; recipeId: string }
    
    if (!userId || !recipeId) {
      return HttpResponse.json(
        { success: false, error: 'user_id and recipe_id are required' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      success: true,
    })
  }),

  // GET /user/:userId/recipe/:recipeId - Get recipe with user data
  http.get(`${API_URL}/user/:userId/recipe/:recipeId`, ({ params }) => {
    const { userId, recipeId } = params as { userId: string; recipeId: string }
    
    if (!userId || !recipeId) {
      return HttpResponse.json(
        { success: false, error: 'user_id and recipe_id are required' },
        { status: 400 }
      )
    }
    
    const recipe = createMockRecipeWithUserData({ id: recipeId })
    
    return HttpResponse.json({
      success: true,
      data: recipe,
    })
  }),

  // GET /user/:userId/recipe/:recipeId/saved - Check if recipe is saved
  http.get(`${API_URL}/user/:userId/recipe/:recipeId/saved`, ({ params }) => {
    const { userId, recipeId } = params as { userId: string; recipeId: string }
    
    if (!userId || !recipeId) {
      return HttpResponse.json(
        { success: false, error: 'user_id and recipe_id are required' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: { is_saved: SAVED_RECIPE_IDS.includes(recipeId) },
    })
  }),
]
