import type { FastifyInstance } from 'fastify';
import {
  getUserSavedRecipes,
  saveRecipeForUser,
  removeSavedRecipe,
  isRecipeSaved,
} from '@cook-mode/db';

export async function registerUserRoutes(fastify: FastifyInstance) {
  // Get user's saved recipes
  fastify.get<{
    Params: { userId: string };
    Querystring: { page?: string; limit?: string; favorites_only?: string };
  }>('/:userId/recipes', async (request, reply) => {
    const { userId } = request.params;
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);
    const favoritesOnly = request.query.favorites_only === 'true';

    try {
      const result = await getUserSavedRecipes(userId, page, limit, favoritesOnly);
      reply.send({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      fastify.log.error(error, 'Error fetching saved recipes');
      reply.status(500).send({ success: false, error: 'Failed to fetch saved recipes' });
    }
  });

  // Save a recipe
  fastify.post<{
    Params: { userId: string; recipeId: string };
    Body: { notes?: string; is_favorite?: boolean };
  }>('/:userId/recipes/:recipeId', async (request, reply) => {
    const { userId, recipeId } = request.params;
    const { notes, is_favorite = false } = request.body || {};

    try {
      // Check if already saved
      const alreadySaved = await isRecipeSaved(userId, recipeId);
      if (alreadySaved) {
        reply.status(409).send({ success: false, error: 'Recipe already saved' });
        return;
      }

      const saved = await saveRecipeForUser(userId, recipeId, notes, is_favorite);
      reply.status(201).send({ success: true, data: saved });
    } catch (error) {
      fastify.log.error(error, 'Error saving recipe');
      reply.status(500).send({ success: false, error: 'Failed to save recipe' });
    }
  });

  // Remove a saved recipe
  fastify.delete<{
    Params: { userId: string; recipeId: string };
  }>('/:userId/recipes/:recipeId', async (request, reply) => {
    const { userId, recipeId } = request.params;

    try {
      const removed = await removeSavedRecipe(userId, recipeId);
      if (!removed) {
        reply.status(404).send({ success: false, error: 'Recipe not found in saved recipes' });
        return;
      }
      reply.send({ success: true, message: 'Recipe removed from saved' });
    } catch (error) {
      fastify.log.error(error, 'Error removing saved recipe');
      reply.status(500).send({ success: false, error: 'Failed to remove saved recipe' });
    }
  });

  // Check if recipe is saved
  fastify.get<{
    Params: { userId: string; recipeId: string };
  }>('/:userId/recipes/:recipeId/saved', async (request, reply) => {
    const { userId, recipeId } = request.params;

    try {
      const isSaved = await isRecipeSaved(userId, recipeId);
      reply.send({ success: true, data: { isSaved } });
    } catch (error) {
      fastify.log.error(error, 'Error checking if recipe is saved');
      reply.status(500).send({ success: false, error: 'Failed to check saved status' });
    }
  });
}
