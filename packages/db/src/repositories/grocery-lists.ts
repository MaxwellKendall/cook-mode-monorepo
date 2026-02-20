import { eq, sql, count } from 'drizzle-orm';
import { getDb } from '../client.js';
import {
  groceryLists,
  groceryListItems,
  type GroceryList,
  type GroceryListItem,
} from '../schema.js';

export interface CreateGroceryListInput {
  weeklyPlanId: string;
  userId?: string;
  anonymousSessionId?: string;
}

export interface AddManualItemInput {
  groceryListId: string;
  name: string;
  quantity?: string;
  category: string;
}

export interface GroceryListWithItems extends GroceryList {
  items: GroceryListItem[];
}

export interface GroceryListProgress {
  checked: number;
  total: number;
}

export async function createGroceryList(input: CreateGroceryListInput): Promise<GroceryList> {
  const db = getDb();

  const [list] = await db
    .insert(groceryLists)
    .values({
      weeklyPlanId: input.weeklyPlanId,
      userId: input.userId,
      anonymousSessionId: input.anonymousSessionId,
    })
    .returning();

  return list!;
}

export async function getGroceryListByPlanId(weeklyPlanId: string): Promise<GroceryListWithItems | null> {
  const db = getDb();

  const [list] = await db
    .select()
    .from(groceryLists)
    .where(eq(groceryLists.weeklyPlanId, weeklyPlanId))
    .limit(1);

  if (!list) return null;

  const items = await db
    .select()
    .from(groceryListItems)
    .where(eq(groceryListItems.groceryListId, list.id));

  return { ...list, items };
}

export async function getGroceryListById(listId: string): Promise<GroceryListWithItems | null> {
  const db = getDb();

  const [list] = await db
    .select()
    .from(groceryLists)
    .where(eq(groceryLists.id, listId))
    .limit(1);

  if (!list) return null;

  const items = await db
    .select()
    .from(groceryListItems)
    .where(eq(groceryListItems.groceryListId, listId));

  return { ...list, items };
}

export async function toggleItem(itemId: string, checked: boolean): Promise<GroceryListItem | null> {
  const db = getDb();

  const [updated] = await db
    .update(groceryListItems)
    .set({
      checked,
      checkedAt: checked ? new Date() : null,
    })
    .where(eq(groceryListItems.id, itemId))
    .returning();

  return updated || null;
}

export async function addManualItem(input: AddManualItemInput): Promise<GroceryListItem> {
  const db = getDb();

  const [item] = await db
    .insert(groceryListItems)
    .values({
      groceryListId: input.groceryListId,
      name: input.name,
      quantity: input.quantity,
      category: input.category,
      isManualAdd: true,
    })
    .returning();

  return item!;
}

export async function removeItem(itemId: string): Promise<boolean> {
  const db = getDb();

  const result = await db
    .delete(groceryListItems)
    .where(eq(groceryListItems.id, itemId))
    .returning({ id: groceryListItems.id });

  return result.length > 0;
}

export async function getGroceryListProgress(listId: string): Promise<GroceryListProgress> {
  const db = getDb();

  const [result] = await db
    .select({
      total: count(),
      checked: count(sql`CASE WHEN ${groceryListItems.checked} = true THEN 1 END`),
    })
    .from(groceryListItems)
    .where(eq(groceryListItems.groceryListId, listId));

  return {
    checked: result?.checked ?? 0,
    total: result?.total ?? 0,
  };
}
