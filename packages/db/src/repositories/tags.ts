import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import {
  userTags,
  userRecipeTags,
  userRecipeSaves,
  type UserTag,
  type UserRecipeTag,
} from '../schema.js';

export interface TagWithUsageCount extends UserTag {
  usageCount: number;
}

export async function getUserTags(
  userId: string,
  includeUsageCount: boolean = true
): Promise<(UserTag & { usageCount?: number })[]> {
  const db = getDb();

  if (includeUsageCount) {
    const tagsWithCounts = await db
      .select({
        id: userTags.id,
        userId: userTags.userId,
        name: userTags.name,
        color: userTags.color,
        createdAt: userTags.createdAt,
        updatedAt: userTags.updatedAt,
        usageCount: sql<number>`cast(count(${userRecipeTags.id}) as integer)`.as('usage_count'),
      })
      .from(userTags)
      .leftJoin(userRecipeTags, eq(userTags.id, userRecipeTags.tagId))
      .where(eq(userTags.userId, userId))
      .groupBy(
        userTags.id,
        userTags.userId,
        userTags.name,
        userTags.color,
        userTags.createdAt,
        userTags.updatedAt
      )
      .orderBy(userTags.name);

    return tagsWithCounts;
  }

  return db.select().from(userTags).where(eq(userTags.userId, userId)).orderBy(userTags.name);
}

export async function getUserTagByName(userId: string, tagName: string): Promise<UserTag | null> {
  const db = getDb();

  const result = await db
    .select()
    .from(userTags)
    .where(and(eq(userTags.userId, userId), eq(userTags.name, tagName)))
    .limit(1);

  return result[0] || null;
}

export async function getRecipeTags(userId: string, recipeId: string): Promise<UserTag[]> {
  const db = getDb();

  return db
    .select({
      id: userTags.id,
      userId: userTags.userId,
      name: userTags.name,
      color: userTags.color,
      createdAt: userTags.createdAt,
      updatedAt: userTags.updatedAt,
    })
    .from(userRecipeTags)
    .innerJoin(userTags, eq(userRecipeTags.tagId, userTags.id))
    .where(and(eq(userRecipeTags.userId, userId), eq(userRecipeTags.recipeId, recipeId)))
    .orderBy(userTags.name);
}

export async function createUserTag(
  userId: string,
  name: string,
  color?: string
): Promise<UserTag> {
  const db = getDb();

  const [newTag] = await db
    .insert(userTags)
    .values({
      userId,
      name,
      color: color || null,
    })
    .returning();

  return newTag!;
}

export async function updateUserTag(
  userId: string,
  tagId: string,
  name?: string,
  color?: string
): Promise<UserTag | null> {
  const db = getDb();

  const updateData: Partial<typeof userTags.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (color !== undefined) updateData.color = color;
  updateData.updatedAt = new Date();

  if (Object.keys(updateData).length === 1) {
    // Only updatedAt
    return null;
  }

  const [updated] = await db
    .update(userTags)
    .set(updateData)
    .where(and(eq(userTags.userId, userId), eq(userTags.id, tagId)))
    .returning();

  return updated || null;
}

export async function deleteUserTag(userId: string, tagId: string): Promise<boolean> {
  const db = getDb();

  const deleted = await db
    .delete(userTags)
    .where(and(eq(userTags.userId, userId), eq(userTags.id, tagId)))
    .returning();

  return deleted.length > 0;
}

export async function applyTagToRecipe(
  userId: string,
  recipeId: string,
  tagId: string
): Promise<UserRecipeTag | null> {
  const db = getDb();

  // Check if recipe is saved
  const [saveCheck] = await db
    .select({ id: userRecipeSaves.id })
    .from(userRecipeSaves)
    .where(and(eq(userRecipeSaves.userId, userId), eq(userRecipeSaves.recipeId, recipeId)))
    .limit(1);

  if (!saveCheck) {
    return null;
  }

  // Check if tag belongs to user
  const [tagCheck] = await db
    .select({ id: userTags.id })
    .from(userTags)
    .where(and(eq(userTags.userId, userId), eq(userTags.id, tagId)))
    .limit(1);

  if (!tagCheck) {
    return null;
  }

  const [applied] = await db
    .insert(userRecipeTags)
    .values({
      userId,
      recipeId,
      tagId,
    })
    .returning();

  return applied!;
}

export async function removeTagFromRecipe(
  userId: string,
  recipeId: string,
  tagId: string
): Promise<boolean> {
  const db = getDb();

  const deleted = await db
    .delete(userRecipeTags)
    .where(
      and(
        eq(userRecipeTags.userId, userId),
        eq(userRecipeTags.recipeId, recipeId),
        eq(userRecipeTags.tagId, tagId)
      )
    )
    .returning();

  return deleted.length > 0;
}

export async function createTagAndApplyToRecipe(
  userId: string,
  recipeId: string,
  name: string,
  color?: string
): Promise<{ tag: UserTag; recipeTag: UserRecipeTag } | null> {
  const db = getDb();

  // Check if recipe is saved
  const [saveCheck] = await db
    .select({ id: userRecipeSaves.id })
    .from(userRecipeSaves)
    .where(and(eq(userRecipeSaves.userId, userId), eq(userRecipeSaves.recipeId, recipeId)))
    .limit(1);

  if (!saveCheck) {
    return null;
  }

  // Use a transaction
  const result = await db.transaction(async (tx) => {
    const [newTag] = await tx
      .insert(userTags)
      .values({
        userId,
        name,
        color: color || null,
      })
      .returning();

    const [appliedTag] = await tx
      .insert(userRecipeTags)
      .values({
        userId,
        recipeId,
        tagId: newTag!.id,
      })
      .returning();

    return {
      tag: newTag!,
      recipeTag: appliedTag!,
    };
  });

  return result;
}
