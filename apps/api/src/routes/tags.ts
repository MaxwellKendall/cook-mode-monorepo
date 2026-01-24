import type { FastifyInstance } from 'fastify';
import {
  getUserTags,
  createUserTag,
  updateUserTag,
  deleteUserTag,
  applyTagToRecipe,
  removeTagFromRecipe,
  createTagAndApplyToRecipe,
} from '@cook-mode/db';

export async function registerTagRoutes(fastify: FastifyInstance) {
  // Get user tags
  fastify.get<{
    Querystring: { user_id: string; include_usage_count?: string };
  }>('/tag', async (request, reply) => {
    const { user_id, include_usage_count = 'true' } = request.query;

    if (!user_id) {
      reply.status(400).send({ success: false, error: 'user_id is required' });
      return;
    }

    try {
      const tags = await getUserTags(user_id, include_usage_count === 'true');
      reply.send({ success: true, data: tags });
    } catch (error) {
      fastify.log.error(error, 'Error fetching tags');
      reply.status(500).send({ success: false, error: 'Failed to fetch tags' });
    }
  });

  // Create user tag
  fastify.post<{
    Body: { user_id: string; name: string; color?: string };
  }>('/tag', async (request, reply) => {
    const { user_id, name, color } = request.body;

    if (!user_id || !name) {
      reply.status(400).send({ success: false, error: 'user_id and name are required' });
      return;
    }

    try {
      const tag = await createUserTag(user_id, name, color);
      reply.send({ success: true, data: tag });
    } catch (error) {
      fastify.log.error(error, 'Error creating tag');
      reply.status(500).send({ success: false, error: 'Failed to create tag' });
    }
  });

  // Update user tag
  fastify.put<{
    Params: { tag_id: string };
    Body: { user_id: string; name?: string; color?: string };
  }>('/tag/:tag_id', async (request, reply) => {
    const { tag_id } = request.params;
    const { user_id, name, color } = request.body;

    if (!user_id) {
      reply.status(400).send({ success: false, error: 'user_id is required' });
      return;
    }

    try {
      const tag = await updateUserTag(user_id, tag_id, name, color);
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

  // Delete user tag completely
  fastify.delete<{
    Params: { tag_id: string };
    Body: { user_id: string };
  }>('/tag/:tag_id', async (request, reply) => {
    const { tag_id } = request.params;
    const { user_id } = request.body;

    if (!user_id) {
      reply.status(400).send({ success: false, error: 'user_id is required' });
      return;
    }

    try {
      const deleted = await deleteUserTag(user_id, tag_id);
      if (!deleted) {
        reply.status(404).send({ success: false, error: 'Tag not found' });
        return;
      }
      reply.send({ success: true, data: { deleted: true } });
    } catch (error) {
      fastify.log.error(error, 'Error deleting tag');
      reply.status(500).send({ success: false, error: 'Failed to delete tag' });
    }
  });

  // Apply tag to recipe
  fastify.post<{
    Params: { tag_id: string };
    Body: { user_id: string; recipe_id: string };
  }>('/tag/:tag_id/apply', async (request, reply) => {
    const { tag_id } = request.params;
    const { user_id, recipe_id } = request.body;

    if (!user_id || !recipe_id) {
      reply.status(400).send({ success: false, error: 'user_id and recipe_id are required' });
      return;
    }

    try {
      const result = await applyTagToRecipe(user_id, recipe_id, tag_id);
      if (!result) {
        reply.status(400).send({ success: false, error: 'Recipe not saved or tag not found' });
        return;
      }
      reply.send({ success: true, data: result });
    } catch (error) {
      fastify.log.error(error, 'Error applying tag to recipe');
      reply.status(500).send({ success: false, error: 'Failed to apply tag' });
    }
  });

  // Remove tag from recipe
  fastify.delete<{
    Params: { tag_id: string };
    Body: { user_id: string; recipe_id: string; usage_count?: number };
  }>('/tag/:tag_id/recipe', async (request, reply) => {
    const { tag_id } = request.params;
    const { user_id, recipe_id } = request.body;

    if (!user_id || !recipe_id) {
      reply.status(400).send({ success: false, error: 'user_id and recipe_id are required' });
      return;
    }

    try {
      const removed = await removeTagFromRecipe(user_id, recipe_id, tag_id);
      if (!removed) {
        reply.status(404).send({ success: false, error: 'Tag not found on recipe' });
        return;
      }
      reply.send({ success: true, data: { removed: true } });
    } catch (error) {
      fastify.log.error(error, 'Error removing tag from recipe');
      reply.status(500).send({ success: false, error: 'Failed to remove tag' });
    }
  });

  // Create tag and apply to recipe in one operation
  fastify.post<{
    Body: { user_id: string; recipe_id: string; name: string; color?: string };
  }>('/tag/apply', async (request, reply) => {
    const { user_id, recipe_id, name, color } = request.body;

    if (!user_id || !recipe_id || !name) {
      reply.status(400).send({ success: false, error: 'user_id, recipe_id, and name are required' });
      return;
    }

    try {
      const result = await createTagAndApplyToRecipe(user_id, recipe_id, name, color);
      if (!result) {
        reply.status(400).send({ success: false, error: 'Recipe not saved for user' });
        return;
      }
      reply.status(201).send({ success: true, data: result });
    } catch (error) {
      fastify.log.error(error, 'Error creating tag and applying to recipe');
      reply.status(500).send({ success: false, error: 'Failed to create and apply tag' });
    }
  });
}
