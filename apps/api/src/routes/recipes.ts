import type { FastifyInstance } from 'fastify';
import { getRecipeById, getRecipeWithUserData, getUserTags, getUserSavedRecipes } from '@cook-mode/db';
import { searchByText, textToVector } from '@cook-mode/vector';

export async function registerRecipeRoutes(fastify: FastifyInstance) {
  // Search recipes
  fastify.post<{
    Body: { query: string; count?: number; user_id?: string };
  }>('/recipes/search', async (request, reply) => {
    const { query, count = 10, user_id } = request.body;

    if (!query || typeof query !== 'string') {
      reply.status(400).send({ success: false, error: 'Missing required field: query' });
      return;
    }

    try {
      // Check if query contains hashtag pattern
      const hashtagMatch = query.match(/^#(\w+)$/);

      if (hashtagMatch && user_id) {
        // Extract tag name from hashtag and search user's saved recipes by tag
        const tagName = query;

        // Get user's tags to find matching tag
        const userTags = await getUserTags(user_id, false);
        const matchingTag = userTags.find(
          (t) => t.name.toLowerCase() === tagName.slice(1).toLowerCase() || t.name.toLowerCase() === tagName.toLowerCase()
        );

        if (matchingTag) {
          // Get saved recipes and filter by tag
          const result = await getUserSavedRecipes(user_id, 1, 100, false);
          const filtered = result.data.filter((recipe) =>
            recipe.tags.some((t) => t.id === matchingTag.id)
          );

          reply.send({
            success: true,
            data: filtered.map((r) => ({
              id: r.id,
              title: r.title,
              summary: r.summary,
              imageUrl: r.imageUrl,
              source: r.source,
              link: r.link,
            })),
            search_type: 'hashtag_filter',
          });
          return;
        }

        // No matching tag found, return empty
        reply.send({
          success: true,
          data: [],
          search_type: 'hashtag_filter',
        });
        return;
      }

      // Regular vector search
      const results = await searchByText(query, textToVector, count);

      reply.send({
        success: true,
        data: results.results.map((r) => ({
          id: r.payload.id,
          title: r.payload.title,
          summary: r.payload.summary,
          imageUrl: r.payload.image_url,
          source: r.payload.source,
          link: r.payload.link,
          score: r.score,
        })),
        search_type: 'vector_search',
      });
    } catch (error) {
      fastify.log.error(error, 'Error searching recipes');
      reply.status(500).send({ success: false, error: 'Failed to search recipes' });
    }
  });

  // Get similar recipes (POST to match source of truth)
  fastify.post<{
    Body: { recipeId: string; count?: number };
  }>('/recipes/similar', async (request, reply) => {
    const { recipeId, count = 5 } = request.body;

    if (!recipeId) {
      reply.status(400).send({ success: false, error: 'Missing required field: recipeId' });
      return;
    }

    try {
      const recipe = await getRecipeById(recipeId);
      if (!recipe) {
        reply.status(404).send({ success: false, error: 'Recipe not found' });
        return;
      }

      // Use the recipe's embedding prompt or title for similarity search
      const searchText = recipe.embeddingPrompt || recipe.title;
      const results = await searchByText(searchText, textToVector, count + 1);

      // Filter out the original recipe
      const similar = results.results.filter((r) => r.payload.id !== recipeId).slice(0, count);

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

  // Get recipe by ID
  fastify.get<{
    Params: { id: string };
    Querystring: { user_id?: string };
  }>('/recipes/:id', async (request, reply) => {
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
}
