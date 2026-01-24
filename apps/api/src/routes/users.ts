import type { FastifyInstance } from 'fastify';
import {
  getUserSavedRecipes,
  saveRecipeForUser,
  removeSavedRecipe,
  isRecipeSaved,
  getDb,
  userRecipeSaves,
  userTags,
  userRecipeTags,
} from '@cook-mode/db';
import { eq, and, count } from 'drizzle-orm';

export async function registerUserRoutes(fastify: FastifyInstance) {
  // Save recipe for user
  fastify.post<{
    Params: { user_id: string; recipe_id: string };
    Body: { notes?: string; is_favorite?: boolean };
  }>('/:user_id/recipe/:recipe_id', async (request, reply) => {
    const { user_id, recipe_id } = request.params;
    const { notes, is_favorite = false } = request.body || {};

    if (!user_id || !recipe_id) {
      reply.status(400).send({ success: false, error: 'Missing required parameters: user_id, recipe_id' });
      return;
    }

    try {
      // Check if already saved
      const alreadySaved = await isRecipeSaved(user_id, recipe_id);
      if (alreadySaved) {
        reply.status(409).send({ success: false, error: 'Recipe already saved' });
        return;
      }

      const saved = await saveRecipeForUser(user_id, recipe_id, notes, is_favorite);
      reply.send({ success: true, data: saved });
    } catch (error) {
      fastify.log.error(error, 'Error saving recipe');
      reply.status(500).send({ success: false, error: 'Failed to save recipe' });
    }
  });

  // Get user's saved recipes
  fastify.get<{
    Params: { user_id: string };
    Querystring: {
      page?: string;
      limit?: string;
      favorite_only?: string;
      with_notes?: string;
      tag_ids?: string;
    };
  }>('/user/:user_id/recipes', async (request, reply) => {
    const { user_id } = request.params;
    const { page = '1', limit = '20', favorite_only, with_notes, tag_ids } = request.query;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 20;
    const favoriteOnly = favorite_only === 'true';
    // with_notes and tag_ids not implemented in current db function - keeping for API compatibility

    try {
      const result = await getUserSavedRecipes(user_id, parsedPage, parsedLimit, favoriteOnly);
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

  // Remove saved recipe for user
  fastify.delete<{
    Params: { user_id: string; recipe_id: string };
  }>('/:user_id/recipe/:recipe_id', async (request, reply) => {
    const { user_id, recipe_id } = request.params;

    try {
      const removed = await removeSavedRecipe(user_id, recipe_id);
      if (!removed) {
        reply.status(404).send({ success: false, error: 'Recipe not found in saved recipes' });
        return;
      }
      reply.send({ success: true, data: { removed: true } });
    } catch (error) {
      fastify.log.error(error, 'Error removing saved recipe');
      reply.status(500).send({ success: false, error: 'Failed to remove saved recipe' });
    }
  });

  // Check if recipe is saved for user
  fastify.get<{
    Params: { user_id: string; recipe_id: string };
  }>('/:user_id/recipe/:recipe_id/saved', async (request, reply) => {
    const { user_id, recipe_id } = request.params;

    try {
      const isSaved = await isRecipeSaved(user_id, recipe_id);
      reply.send({ success: true, data: { is_saved: isSaved } });
    } catch (error) {
      fastify.log.error(error, 'Error checking if recipe is saved');
      reply.status(500).send({ success: false, error: 'Failed to check saved status' });
    }
  });

  // Get user activity summary
  fastify.get<{
    Params: { user_id: string };
  }>('/:user_id/activity', async (request, reply) => {
    const { user_id } = request.params;

    try {
      const db = getDb();

      // Get saved recipes count
      const [savedCountResult] = await db
        .select({ count: count() })
        .from(userRecipeSaves)
        .where(eq(userRecipeSaves.userId, user_id));

      // Get favorites count
      const [favoritesCountResult] = await db
        .select({ count: count() })
        .from(userRecipeSaves)
        .where(and(eq(userRecipeSaves.userId, user_id), eq(userRecipeSaves.isFavorite, true)));

      // Get tags count
      const [tagsCountResult] = await db
        .select({ count: count() })
        .from(userTags)
        .where(eq(userTags.userId, user_id));

      // Get tagged recipes count
      const [taggedRecipesCountResult] = await db
        .select({ count: count() })
        .from(userRecipeTags)
        .where(eq(userRecipeTags.userId, user_id));

      reply.send({
        success: true,
        data: {
          saved_recipes: savedCountResult?.count || 0,
          favorite_recipes: favoritesCountResult?.count || 0,
          custom_tags: tagsCountResult?.count || 0,
          tagged_recipes: taggedRecipesCountResult?.count || 0,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error getting user activity summary');
      reply.status(500).send({ success: false, error: 'Failed to get activity summary' });
    }
  });
}
