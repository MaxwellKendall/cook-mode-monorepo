import type { FastifyInstance } from 'fastify';
import {
  getUserTags,
  createUserTag,
  updateUserTag,
  deleteUserTag,
  applyTagToRecipe,
  removeTagFromRecipe,
  getRecipeTags,
} from '@cook-mode/db';

export async function registerTagRoutes(fastify: FastifyInstance) {
  // Get all tags for a user
  fastify.get<{
    Querystring: { user_id: string; include_count?: string };
  }>('/', async (request, reply) => {
    const { user_id, include_count = 'true' } = request.query;

    if (!user_id) {
      reply.status(400).send({ success: false, error: 'user_id is required' });
      return;
    }

    try {
      const tags = await getUserTags(user_id, include_count === 'true');
      reply.send({ success: true, data: tags });
    } catch (error) {
      fastify.log.error(error, 'Error fetching tags');
      reply.status(500).send({ success: false, error: 'Failed to fetch tags' });
    }
  });

  // Create a new tag
  fastify.post<{
    Body: { user_id: string; name: string; color?: string };
  }>('/', async (request, reply) => {
    const { user_id, name, color } = request.body;

    if (!user_id || !name) {
      reply.status(400).send({ success: false, error: 'user_id and name are required' });
      return;
    }

    try {
      const tag = await createUserTag(user_id, name, color);
      reply.status(201).send({ success: true, data: tag });
    } catch (error) {
      fastify.log.error(error, 'Error creating tag');
      reply.status(500).send({ success: false, error: 'Failed to create tag' });
    }
  });

  // Update a tag
  fastify.put<{
    Params: { tagId: string };
    Body: { user_id: string; name?: string; color?: string };
  }>('/:tagId', async (request, reply) => {
    const { tagId } = request.params;
    const { user_id, name, color } = request.body;

    if (!user_id) {
      reply.status(400).send({ success: false, error: 'user_id is required' });
      return;
    }

    try {
      const tag = await updateUserTag(user_id, tagId, name, color);
      if (!tag) {
        reply.status(404).send({ success: false, error: 'Tag not found' });
        return;
      }
      reply.send({ success: true, data: tag });
    } catch (error) {
      fastify.log.error(error, 'Error updating tag');
      reply.status(500).send({ success: false, error: 'Failed to update tag' });
    }
  });

  // Delete a tag
  fastify.delete<{
    Params: { tagId: string };
    Querystring: { user_id: string };
  }>('/:tagId', async (request, reply) => {
    const { tagId } = request.params;
    const { user_id } = request.query;

    if (!user_id) {
      reply.status(400).send({ success: false, error: 'user_id is required' });
      return;
    }

    try {
      const deleted = await deleteUserTag(user_id, tagId);
      if (!deleted) {
        reply.status(404).send({ success: false, error: 'Tag not found' });
        return;
      }
      reply.send({ success: true, message: 'Tag deleted' });
    } catch (error) {
      fastify.log.error(error, 'Error deleting tag');
      reply.status(500).send({ success: false, error: 'Failed to delete tag' });
    }
  });

  // Get tags for a recipe
  fastify.get<{
    Params: { recipeId: string };
    Querystring: { user_id: string };
  }>('/recipe/:recipeId', async (request, reply) => {
    const { recipeId } = request.params;
    const { user_id } = request.query;

    if (!user_id) {
      reply.status(400).send({ success: false, error: 'user_id is required' });
      return;
    }

    try {
      const tags = await getRecipeTags(user_id, recipeId);
      reply.send({ success: true, data: tags });
    } catch (error) {
      fastify.log.error(error, 'Error fetching recipe tags');
      reply.status(500).send({ success: false, error: 'Failed to fetch recipe tags' });
    }
  });

  // Apply tag to recipe
  fastify.post<{
    Params: { tagId: string; recipeId: string };
    Body: { user_id: string };
  }>('/:tagId/recipe/:recipeId', async (request, reply) => {
    const { tagId, recipeId } = request.params;
    const { user_id } = request.body;

    if (!user_id) {
      reply.status(400).send({ success: false, error: 'user_id is required' });
      return;
    }

    try {
      const result = await applyTagToRecipe(user_id, recipeId, tagId);
      if (!result) {
        reply.status(400).send({ success: false, error: 'Recipe not saved or tag not found' });
        return;
      }
      reply.status(201).send({ success: true, data: result });
    } catch (error) {
      fastify.log.error(error, 'Error applying tag to recipe');
      reply.status(500).send({ success: false, error: 'Failed to apply tag' });
    }
  });

  // Remove tag from recipe
  fastify.delete<{
    Params: { tagId: string; recipeId: string };
    Querystring: { user_id: string };
  }>('/:tagId/recipe/:recipeId', async (request, reply) => {
    const { tagId, recipeId } = request.params;
    const { user_id } = request.query;

    if (!user_id) {
      reply.status(400).send({ success: false, error: 'user_id is required' });
      return;
    }

    try {
      const removed = await removeTagFromRecipe(user_id, recipeId, tagId);
      if (!removed) {
        reply.status(404).send({ success: false, error: 'Tag not found on recipe' });
        return;
      }
      reply.send({ success: true, message: 'Tag removed from recipe' });
    } catch (error) {
      fastify.log.error(error, 'Error removing tag from recipe');
      reply.status(500).send({ success: false, error: 'Failed to remove tag' });
    }
  });
}
