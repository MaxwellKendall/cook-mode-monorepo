import type { FastifyInstance } from 'fastify';
import { getRecipeById, getRecipeWithUserData } from '@cook-mode/db';
import { searchByText, textToVector } from '@cook-mode/vector';

export async function registerRecipeRoutes(fastify: FastifyInstance) {
  // Get recipe by ID
  fastify.get<{
    Params: { id: string };
    Querystring: { user_id?: string };
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { user_id } = request.query;

    try {
      if (user_id) {
        const recipe = await getRecipeWithUserData(id, user_id);
        if (!recipe) {
          reply.status(404).send({ success: false, error: 'Recipe not found' });
          return;
        }
        reply.send({ success: true, data: recipe });
      } else {
        const recipe = await getRecipeById(id);
        if (!recipe) {
          reply.status(404).send({ success: false, error: 'Recipe not found' });
          return;
        }
        reply.send({ success: true, data: recipe });
      }
    } catch (error) {
      fastify.log.error(error, 'Error fetching recipe');
      reply.status(500).send({ success: false, error: 'Failed to fetch recipe' });
    }
  });

  // Search recipes
  fastify.post<{
    Body: { query: string; count?: number };
  }>('/search', async (request, reply) => {
    const { query, count = 10 } = request.body;

    if (!query || typeof query !== 'string') {
      reply.status(400).send({ success: false, error: 'Query is required' });
      return;
    }

    try {
      const results = await searchByText(query, textToVector, count);

      reply.send({
        success: true,
        data: results.results.map((r) => ({
          id: r.payload.id,
          title: r.payload.title,
          summary: r.payload.summary,
          imageUrl: r.payload.imageUrl,
          source: r.payload.source,
          link: r.payload.link,
          score: r.score,
        })),
        total: results.total,
        searchTimeMs: results.searchTimeMs,
      });
    } catch (error) {
      fastify.log.error(error, 'Error searching recipes');
      reply.status(500).send({ success: false, error: 'Failed to search recipes' });
    }
  });

  // Get similar recipes
  fastify.get<{
    Params: { id: string };
    Querystring: { count?: string };
  }>('/similar/:id', async (request, reply) => {
    const { id } = request.params;
    const count = parseInt(request.query.count || '5', 10);

    try {
      const recipe = await getRecipeById(id);
      if (!recipe) {
        reply.status(404).send({ success: false, error: 'Recipe not found' });
        return;
      }

      // Use the recipe's embedding prompt or title for similarity search
      const searchText = recipe.embeddingPrompt || recipe.title;
      const results = await searchByText(searchText, textToVector, count + 1);

      // Filter out the original recipe
      const similar = results.results
        .filter((r) => r.payload.id !== id)
        .slice(0, count);

      reply.send({
        success: true,
        data: similar.map((r) => ({
          id: r.payload.id,
          title: r.payload.title,
          summary: r.payload.summary,
          imageUrl: r.payload.imageUrl,
          source: r.payload.source,
          score: r.score,
        })),
      });
    } catch (error) {
      fastify.log.error(error, 'Error finding similar recipes');
      reply.status(500).send({ success: false, error: 'Failed to find similar recipes' });
    }
  });
}
