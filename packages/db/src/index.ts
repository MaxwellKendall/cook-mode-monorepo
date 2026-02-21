// Schema exports
export * from './schema.js';

// Client exports
export { getDb, getSql, testConnection, closeConnection } from './client.js';

// Repository exports
export {
  getRecipeById,
  getRecipeWithUserData,
  getUserSavedRecipes,
  saveRecipeForUser,
  removeSavedRecipe,
  isRecipeSaved,
} from './repositories/recipes.js';

export {
  getUserTags,
  getUserTagByName,
  getRecipeTags,
  createUserTag,
  updateUserTag,
  deleteUserTag,
  applyTagToRecipe,
  removeTagFromRecipe,
  createTagAndApplyToRecipe,
} from './repositories/tags.js';

export {
  getUserSubscription,
  updateUserSubscription,
  getUserByCustomerId,
  recordTokenUsage,
  hasAvailableMinutes,
  getRemainingMinutes,
} from './repositories/subscriptions.js';

export {
  startVoiceSession,
  endVoiceSession,
} from './repositories/voice-sessions.js';

export {
  createMealPlan,
  getUserMealPlans,
  getMealPlanById,
  updateMealPlanStatus,
  deleteMealPlan,
  type MealPlanStatus,
  type CreateMealPlanInput,
} from './repositories/meal-plans.js';

export {
  createWeeklyPlan,
  getWeeklyPlanById,
  getUserWeeklyPlans,
  getWeeklyPlanByAnonymousSession,
  updateWeeklyPlanStatus,
  markMealCooked,
  deleteWeeklyPlan,
  claimAnonymousWeeklyPlans,
  type WeeklyPlanStatus,
  type CreateWeeklyPlanInput,
} from './repositories/weekly-plans.js';

export {
  createGroceryList,
  getGroceryListByPlanId,
  getGroceryListById,
  toggleItem,
  addManualItem,
  removeItem,
  bulkInsertItems,
  getGroceryListProgress,
  type CreateGroceryListInput,
  type AddManualItemInput,
  type BulkInsertItemInput,
  type GroceryListWithItems,
  type GroceryListProgress,
} from './repositories/grocery-lists.js';
