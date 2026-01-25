import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../client.js';
import { mealPlans, type MealPlan, type NewMealPlan } from '../schema.js';

export type MealPlanStatus = 'active' | 'completed';

export interface CreateMealPlanInput {
  userId: string;
  ingredients: string[];
  plan: {
    now: {
      recipeId: string;
      title: string;
      reasoning: string;
      matchedIngredients: string[];
      missingIngredients: string[];
      fromSavedRecipes: boolean;
      imageUrl?: string;
      prepTime?: string;
      cookTime?: string;
    };
    next: {
      recipeId: string;
      title: string;
      reasoning: string;
      matchedIngredients: string[];
      missingIngredients: string[];
      fromSavedRecipes: boolean;
      imageUrl?: string;
      prepTime?: string;
      cookTime?: string;
    };
    later: {
      recipeId: string;
      title: string;
      reasoning: string;
      matchedIngredients: string[];
      missingIngredients: string[];
      fromSavedRecipes: boolean;
      imageUrl?: string;
      prepTime?: string;
      cookTime?: string;
    };
  };
}

export async function createMealPlan(input: CreateMealPlanInput): Promise<MealPlan> {
  const db = getDb();

  const [plan] = await db
    .insert(mealPlans)
    .values({
      userId: input.userId,
      ingredients: input.ingredients,
      plan: input.plan,
      status: 'active',
    })
    .returning();

  return plan!;
}

export async function getUserMealPlans(
  userId: string,
  status?: MealPlanStatus
): Promise<MealPlan[]> {
  const db = getDb();

  const conditions = status
    ? and(eq(mealPlans.userId, userId), eq(mealPlans.status, status))
    : eq(mealPlans.userId, userId);

  const plans = await db
    .select()
    .from(mealPlans)
    .where(conditions)
    .orderBy(desc(mealPlans.createdAt));

  return plans;
}

export async function getMealPlanById(
  planId: string,
  userId: string
): Promise<MealPlan | null> {
  const db = getDb();

  const [plan] = await db
    .select()
    .from(mealPlans)
    .where(and(eq(mealPlans.id, planId), eq(mealPlans.userId, userId)))
    .limit(1);

  return plan || null;
}

export async function updateMealPlanStatus(
  planId: string,
  userId: string,
  status: MealPlanStatus
): Promise<MealPlan | null> {
  const db = getDb();

  const completedAt = status === 'completed' ? new Date() : null;

  const [updated] = await db
    .update(mealPlans)
    .set({
      status,
      completedAt,
    })
    .where(and(eq(mealPlans.id, planId), eq(mealPlans.userId, userId)))
    .returning();

  return updated || null;
}

export async function deleteMealPlan(
  planId: string,
  userId: string
): Promise<boolean> {
  const db = getDb();

  const result = await db
    .delete(mealPlans)
    .where(and(eq(mealPlans.id, planId), eq(mealPlans.userId, userId)))
    .returning({ id: mealPlans.id });

  return result.length > 0;
}
