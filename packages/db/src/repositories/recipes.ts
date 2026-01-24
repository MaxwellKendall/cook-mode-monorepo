import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../client.js';
import {
  recipes,
  userRecipeSaves,
  userTags,
  userRecipeTags,
  type Recipe,
  type UserTag,
  type UserRecipeSave,
} from '../schema.js';

export interface RecipeWithRelations extends Recipe {
  instructions?: { instruction: string; stepNumber: number }[];
  nutrients?: {
    calories?: string | null;
    proteinContent?: string | null;
    carbohydrateContent?: string | null;
    fatContent?: string | null;
    fiberContent?: string | null;
    sugarContent?: string | null;
    sodiumContent?: string | null;
  } | null;
}

export interface RecipeWithUserData extends RecipeWithRelations {
  userTags: UserTag[];
  isSaved: boolean;
  savedAt?: Date;
  notes?: string | null;
  isFavorite?: boolean;
}

export interface SavedRecipeResult extends Recipe {
  saved_at: Date;
  notes: string | null;
  is_favorite: boolean;
  tags: UserTag[];
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function getRecipeById(recipeId: string): Promise<RecipeWithRelations | null> {
  const db = getDb();

  const result = await db.query.recipes.findFirst({
    where: eq(recipes.id, recipeId),
    with: {
      instructions: true,
      nutrients: true,
    },
  });

  if (!result) return null;

  return {
    ...result,
    instructions: (result.instructions || []).map((i) => ({
      instruction: i.instruction,
      stepNumber: i.stepNumber,
    })),
    nutrients: result.nutrients,
  };
}

export async function getRecipeWithUserData(
  recipeId: string,
  userId: string
): Promise<RecipeWithUserData | null> {
  const db = getDb();

  const recipe = await getRecipeById(recipeId);
  if (!recipe) return null;

  // Check if saved
  const [saveRecord] = await db
    .select()
    .from(userRecipeSaves)
    .where(and(eq(userRecipeSaves.userId, userId), eq(userRecipeSaves.recipeId, recipeId)))
    .limit(1);

  // Get tags
  const tags = await db
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
    .where(and(eq(userRecipeTags.userId, userId), eq(userRecipeTags.recipeId, recipeId)));

  return {
    ...recipe,
    userTags: tags,
    isSaved: !!saveRecord,
    savedAt: saveRecord?.savedAt,
    notes: saveRecord?.notes,
    isFavorite: saveRecord?.isFavorite,
  };
}

export async function getUserSavedRecipes(
  userId: string,
  page: number = 1,
  limit: number = 20,
  favoriteOnly: boolean = false
): Promise<PaginationResult<SavedRecipeResult>> {
  const db = getDb();
  const offset = (page - 1) * limit;

  const conditions = [eq(userRecipeSaves.userId, userId)];
  if (favoriteOnly) {
    conditions.push(eq(userRecipeSaves.isFavorite, true));
  }

  // Get saved recipes with tags in a single query
  const savedRecipesWithTags = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      originalTitle: recipes.originalTitle,
      link: recipes.link,
      source: recipes.source,
      ingredients: recipes.ingredients,
      servings: recipes.servings,
      prepTime: recipes.prepTime,
      cookTime: recipes.cookTime,
      summary: recipes.summary,
      originalSummary: recipes.originalSummary,
      imageUrl: recipes.imageUrl,
      qualificationMethod: recipes.qualificationMethod,
      qualified: recipes.qualified,
      levelOfEffort: recipes.levelOfEffort,
      rating: recipes.rating,
      ratingCount: recipes.ratingCount,
      vectorEmbedded: recipes.vectorEmbedded,
      vectorId: recipes.vectorId,
      newsletterEdition: recipes.newsletterEdition,
      embeddingPrompt: recipes.embeddingPrompt,
      createdAt: recipes.createdAt,
      updatedAt: recipes.updatedAt,
      saved_at: userRecipeSaves.savedAt,
      notes: userRecipeSaves.notes,
      is_favorite: userRecipeSaves.isFavorite,
      tag_id: userTags.id,
      tag_userId: userTags.userId,
      tag_name: userTags.name,
      tag_color: userTags.color,
      tag_createdAt: userTags.createdAt,
      tag_updatedAt: userTags.updatedAt,
    })
    .from(userRecipeSaves)
    .innerJoin(recipes, eq(userRecipeSaves.recipeId, recipes.id))
    .leftJoin(
      userRecipeTags,
      and(eq(userRecipeTags.recipeId, recipes.id), eq(userRecipeTags.userId, userId))
    )
    .leftJoin(userTags, eq(userRecipeTags.tagId, userTags.id))
    .where(and(...conditions))
    .orderBy(desc(userRecipeSaves.savedAt))
    .limit(limit)
    .offset(offset);

  // Group results by recipe
  const recipeMap = new Map<string, SavedRecipeResult>();

  for (const row of savedRecipesWithTags) {
    const recipeId = row.id;

    if (!recipeMap.has(recipeId)) {
      recipeMap.set(recipeId, {
        id: row.id,
        title: row.title,
        originalTitle: row.originalTitle,
        link: row.link,
        source: row.source,
        ingredients: row.ingredients,
        servings: row.servings,
        prepTime: row.prepTime,
        cookTime: row.cookTime,
        summary: row.summary,
        originalSummary: row.originalSummary,
        imageUrl: row.imageUrl,
        qualificationMethod: row.qualificationMethod,
        qualified: row.qualified,
        levelOfEffort: row.levelOfEffort,
        rating: row.rating,
        ratingCount: row.ratingCount,
        vectorEmbedded: row.vectorEmbedded,
        vectorId: row.vectorId,
        newsletterEdition: row.newsletterEdition,
        embeddingPrompt: row.embeddingPrompt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        saved_at: row.saved_at,
        notes: row.notes,
        is_favorite: row.is_favorite,
        tags: [],
      });
    }

    if (row.tag_id && row.tag_userId && row.tag_name) {
      const recipe = recipeMap.get(recipeId)!;
      recipe.tags.push({
        id: row.tag_id,
        userId: row.tag_userId,
        name: row.tag_name,
        color: row.tag_color,
        createdAt: row.tag_createdAt!,
        updatedAt: row.tag_updatedAt!,
      });
    }
  }

  const data = Array.from(recipeMap.values());
  const total = data.length; // Simplified - in production, do a separate count query
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function saveRecipeForUser(
  userId: string,
  recipeId: string,
  notes?: string,
  isFavorite: boolean = false
): Promise<UserRecipeSave> {
  const db = getDb();

  const [savedRecipe] = await db
    .insert(userRecipeSaves)
    .values({
      userId,
      recipeId,
      notes: notes || null,
      isFavorite,
    })
    .returning();

  return savedRecipe!;
}

export async function removeSavedRecipe(userId: string, recipeId: string): Promise<boolean> {
  const db = getDb();

  const deleted = await db
    .delete(userRecipeSaves)
    .where(and(eq(userRecipeSaves.userId, userId), eq(userRecipeSaves.recipeId, recipeId)))
    .returning();

  return deleted.length > 0;
}

export async function isRecipeSaved(userId: string, recipeId: string): Promise<boolean> {
  const db = getDb();

  const [result] = await db
    .select({ id: userRecipeSaves.id })
    .from(userRecipeSaves)
    .where(and(eq(userRecipeSaves.userId, userId), eq(userRecipeSaves.recipeId, recipeId)))
    .limit(1);

  return !!result;
}
