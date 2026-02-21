import type { FastifyInstance } from 'fastify';
import {
  getGroceryListById,
  getGroceryListByPlanId,
  getGroceryListProgress,
  toggleItem,
  addManualItem,
  removeItem,
} from '@cook-mode/db';

const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Produce',
  meat_seafood: 'Meat & Seafood',
  dairy: 'Dairy',
  pantry: 'Pantry',
  frozen: 'Frozen',
  bakery: 'Bakery',
  other: 'Other',
};

const CATEGORY_ORDER = ['produce', 'meat_seafood', 'dairy', 'pantry', 'frozen', 'bakery', 'other'];

function groupItemsByCategory(items: Array<{ category: string; [key: string]: unknown }>) {
  const grouped: Record<string, typeof items> = {};

  for (const item of items) {
    const cat = item.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat]!.push(item);
  }

  return CATEGORY_ORDER
    .filter((cat) => grouped[cat] && grouped[cat]!.length > 0)
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      items: grouped[cat]!,
    }));
}

export async function registerGroceryListRoutes(fastify: FastifyInstance) {
  // GET /grocery-lists/:id — Get list with items grouped by category
  fastify.get<{
    Params: { id: string };
  }>('/grocery-lists/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const list = await getGroceryListById(id);
      if (!list) {
        return reply.status(404).send({ success: false, error: 'Grocery list not found' });
      }

      const progress = await getGroceryListProgress(id);
      const sections = groupItemsByCategory(list.items);

      reply.status(200).send({
        success: true,
        data: {
          id: list.id,
          weeklyPlanId: list.weeklyPlanId,
          progress,
          sections,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error fetching grocery list');
      reply.status(500).send({ success: false, error: 'Failed to fetch grocery list' });
    }
  });

  // GET /grocery-lists/by-plan/:weeklyPlanId — Get list for a weekly plan
  fastify.get<{
    Params: { weeklyPlanId: string };
  }>('/grocery-lists/by-plan/:weeklyPlanId', async (request, reply) => {
    try {
      const { weeklyPlanId } = request.params;

      const list = await getGroceryListByPlanId(weeklyPlanId);
      if (!list) {
        return reply.status(404).send({ success: false, error: 'Grocery list not found' });
      }

      const progress = await getGroceryListProgress(list.id);
      const sections = groupItemsByCategory(list.items);

      reply.status(200).send({
        success: true,
        data: {
          id: list.id,
          weeklyPlanId: list.weeklyPlanId,
          progress,
          sections,
        },
      });
    } catch (error) {
      fastify.log.error(error, 'Error fetching grocery list by plan');
      reply.status(500).send({ success: false, error: 'Failed to fetch grocery list' });
    }
  });

  // PATCH /grocery-lists/:id/items/:itemId — Toggle item checked/unchecked (auth required)
  fastify.patch<{
    Params: { id: string; itemId: string };
    Body: { checked: boolean };
  }>('/grocery-lists/:id/items/:itemId', async (request, reply) => {
    try {
      const { itemId } = request.params;
      const { checked } = request.body;

      if (typeof checked !== 'boolean') {
        return reply.status(400).send({
          success: false,
          error: 'checked must be a boolean',
        });
      }

      const item = await toggleItem(itemId, checked);
      if (!item) {
        return reply.status(404).send({ success: false, error: 'Item not found' });
      }

      reply.status(200).send({ success: true, data: item });
    } catch (error) {
      fastify.log.error(error, 'Error toggling grocery item');
      reply.status(500).send({ success: false, error: 'Failed to toggle item' });
    }
  });

  // POST /grocery-lists/:id/items — Add a manual item (auth required)
  fastify.post<{
    Params: { id: string };
    Body: { name: string; quantity?: string; category?: string };
  }>('/grocery-lists/:id/items', async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, quantity, category } = request.body;

      if (!name || typeof name !== 'string' || name.trim() === '') {
        return reply.status(400).send({
          success: false,
          error: 'name is required',
        });
      }

      const item = await addManualItem({
        groceryListId: id,
        name: name.trim(),
        quantity,
        category: category ?? 'other',
      });

      reply.status(201).send({ success: true, data: item });
    } catch (error) {
      fastify.log.error(error, 'Error adding manual grocery item');
      reply.status(500).send({ success: false, error: 'Failed to add item' });
    }
  });

  // DELETE /grocery-lists/:id/items/:itemId — Remove a manual item (auth required)
  fastify.delete<{
    Params: { id: string; itemId: string };
  }>('/grocery-lists/:id/items/:itemId', async (request, reply) => {
    try {
      const { itemId } = request.params;

      const deleted = await removeItem(itemId);
      if (!deleted) {
        return reply.status(404).send({ success: false, error: 'Item not found' });
      }

      reply.status(200).send({ success: true, message: 'Item removed' });
    } catch (error) {
      fastify.log.error(error, 'Error removing grocery item');
      reply.status(500).send({ success: false, error: 'Failed to remove item' });
    }
  });
}
