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
