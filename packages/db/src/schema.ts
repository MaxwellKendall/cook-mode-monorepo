import { pgTable, uuid, varchar, text, boolean, integer, decimal, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Lookup tables
export const cuisines = pgTable('cuisines', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cookingTools = pgTable('cooking_tools', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const keywords = pgTable('keywords', {
  id: uuid('id').primaryKey().defaultRandom(),
  keyword: varchar('keyword', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Main recipes table
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  originalTitle: varchar('original_title', { length: 255 }),
  link: text('link').notNull(),
  source: varchar('source', { length: 255 }).notNull(),
  ingredients: text('ingredients').notNull(),
  servings: varchar('servings', { length: 50 }),
  prepTime: varchar('prep_time', { length: 50 }),
  cookTime: varchar('cook_time', { length: 50 }),
  summary: text('summary'),
  originalSummary: text('original_summary'),
  imageUrl: text('image_url'),
  qualificationMethod: varchar('qualification_method', { length: 100 }),
  qualified: boolean('qualified').notNull().default(false),
  levelOfEffort: integer('level_of_effort'),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  ratingCount: integer('rating_count').notNull().default(0),
  vectorEmbedded: boolean('vector_embedded').notNull().default(false),
  vectorId: varchar('vector_id', { length: 255 }),
  newsletterEdition: varchar('newsletter_edition', { length: 100 }),
  embeddingPrompt: text('embedding_prompt'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  titleIdx: index('idx_recipes_title').on(table.title),
  createdAtIdx: index('idx_recipes_created_at').on(table.createdAt),
  ratingIdx: index('idx_recipes_rating').on(table.rating),
  vectorEmbeddedIdx: index('idx_recipes_vector_embedded').on(table.vectorEmbedded),
}));

// Recipe instructions table
export const recipeInstructions = pgTable('recipe_instructions', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  instruction: text('instruction').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  recipeIdIdx: index('idx_recipe_instructions_recipe_id').on(table.recipeId),
  uniqueRecipeStep: unique('unique_recipe_step').on(table.recipeId, table.stepNumber),
}));

// Recipe nutrients table
export const recipeNutrients = pgTable('recipe_nutrients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  calories: varchar('calories', { length: 50 }),
  carbohydrateContent: varchar('carbohydrate_content', { length: 50 }),
  cholesterolContent: varchar('cholesterol_content', { length: 50 }),
  fiberContent: varchar('fiber_content', { length: 50 }),
  proteinContent: varchar('protein_content', { length: 50 }),
  saturatedFatContent: varchar('saturated_fat_content', { length: 50 }),
  sodiumContent: varchar('sodium_content', { length: 50 }),
  sugarContent: varchar('sugar_content', { length: 50 }),
  fatContent: varchar('fat_content', { length: 50 }),
  unsaturatedFatContent: varchar('unsaturated_fat_content', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  recipeIdIdx: index('idx_recipe_nutrients_recipe_id').on(table.recipeId),
  uniqueRecipe: unique('unique_recipe_nutrients').on(table.recipeId),
}));

// Recipe relevance table
export const recipeRelevance = pgTable('recipe_relevance', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  familyScore: decimal('family_score', { precision: 5, scale: 2 }),
  singleScore: decimal('single_score', { precision: 5, scale: 2 }),
  healthScore: decimal('health_score', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  recipeIdIdx: index('idx_recipe_relevance_recipe_id').on(table.recipeId),
  uniqueRecipe: unique('unique_recipe_relevance').on(table.recipeId),
}));

// Junction tables for many-to-many relationships
export const recipeCuisines = pgTable('recipe_cuisines', {
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  cuisineId: uuid('cuisine_id').notNull().references(() => cuisines.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: unique('recipe_cuisines_pkey').on(table.recipeId, table.cuisineId),
  recipeIdIdx: index('idx_recipe_cuisines_recipe_id').on(table.recipeId),
  cuisineIdIdx: index('idx_recipe_cuisines_cuisine_id').on(table.cuisineId),
}));

export const recipeCategories = pgTable('recipe_categories', {
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: unique('recipe_categories_pkey').on(table.recipeId, table.categoryId),
  recipeIdIdx: index('idx_recipe_categories_recipe_id').on(table.recipeId),
  categoryIdIdx: index('idx_recipe_categories_category_id').on(table.categoryId),
}));

export const recipeTools = pgTable('recipe_tools', {
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  toolId: uuid('tool_id').notNull().references(() => cookingTools.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: unique('recipe_tools_pkey').on(table.recipeId, table.toolId),
  recipeIdIdx: index('idx_recipe_tools_recipe_id').on(table.recipeId),
  toolIdIdx: index('idx_recipe_tools_tool_id').on(table.toolId),
}));

export const recipeKeywords = pgTable('recipe_keywords', {
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  keywordId: uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: unique('recipe_keywords_pkey').on(table.recipeId, table.keywordId),
  recipeIdIdx: index('idx_recipe_keywords_recipe_id').on(table.recipeId),
  keywordIdIdx: index('idx_recipe_keywords_keyword_id').on(table.keywordId),
}));

// User-related tables
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userRecipeSaves = pgTable('user_recipe_saves', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
  notes: text('notes'),
  isFavorite: boolean('is_favorite').notNull().default(false),
}, (table) => ({
  userIdIdx: index('idx_user_recipe_saves_user_id').on(table.userId),
  recipeIdIdx: index('idx_user_recipe_saves_recipe_id').on(table.recipeId),
  savedAtIdx: index('idx_user_recipe_saves_saved_at').on(table.savedAt),
  favoriteIdx: index('idx_user_recipe_saves_favorite').on(table.isFavorite),
  uniqueUserRecipe: unique('unique_user_recipe_save').on(table.userId, table.recipeId),
}));

export const userTags = pgTable('user_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_tags_user_id').on(table.userId),
  nameIdx: index('idx_user_tags_name').on(table.name),
  uniqueUserTagName: unique('unique_user_tag_name').on(table.userId, table.name),
}));

export const userRecipeTags = pgTable('user_recipe_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => userTags.id, { onDelete: 'cascade' }),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_recipe_tags_user_id').on(table.userId),
  recipeIdIdx: index('idx_user_recipe_tags_recipe_id').on(table.recipeId),
  tagIdIdx: index('idx_user_recipe_tags_tag_id').on(table.tagId),
  uniqueUserRecipeTag: unique('unique_user_recipe_tag').on(table.userId, table.recipeId, table.tagId),
}));

// User subscriptions table
export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  isSubscribed: boolean('is_subscribed').notNull().default(false),
  subscriptionId: varchar('subscription_id', { length: 255 }),
  customerId: varchar('customer_id', { length: 255 }),
  status: varchar('status', { length: 50 }).default('inactive'),
  inputTokensUsed: integer('input_tokens_used').notNull().default(0),
  outputTokensUsed: integer('output_tokens_used').notNull().default(0),
  plan: varchar('plan', { length: 50 }).notNull().default('free'),
  incurredCost: decimal('incurred_cost', { precision: 10, scale: 6 }).notNull().default('0.000000'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_subscriptions_user_id').on(table.userId),
  customerIdIdx: index('idx_user_subscriptions_customer_id').on(table.customerId),
  subscriptionIdIdx: index('idx_user_subscriptions_subscription_id').on(table.subscriptionId),
  statusIdx: index('idx_user_subscriptions_status').on(table.status),
  planIdx: index('idx_user_subscriptions_plan').on(table.plan),
}));

// Voice sessions tracking table
export const voiceSessions = pgTable('voice_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 4 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_voice_sessions_user_id').on(table.userId),
  recipeIdIdx: index('idx_voice_sessions_recipe_id').on(table.recipeId),
  startedAtIdx: index('idx_voice_sessions_started_at').on(table.startedAt),
}));

// Jobs table for async processing
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  operationType: varchar('operation_type', { length: 50 }).notNull(),
  operationPayload: text('operation_payload').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  result: text('result'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  statusIdx: index('idx_jobs_status').on(table.status),
  createdAtIdx: index('idx_jobs_created_at').on(table.createdAt),
}));

// Job events table
export const jobEvents = pgTable('job_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventData: text('event_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  jobIdIdx: index('idx_job_events_job_id').on(table.jobId),
}));

// Relations
export const recipesRelations = relations(recipes, ({ many, one }) => ({
  instructions: many(recipeInstructions),
  nutrients: one(recipeNutrients),
  relevance: one(recipeRelevance),
  cuisines: many(recipeCuisines),
  categories: many(recipeCategories),
  tools: many(recipeTools),
  keywords: many(recipeKeywords),
  userSaves: many(userRecipeSaves),
  userTags: many(userRecipeTags),
}));

export const recipeInstructionsRelations = relations(recipeInstructions, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeInstructions.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeNutrientsRelations = relations(recipeNutrients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeNutrients.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeRelevanceRelations = relations(recipeRelevance, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeRelevance.recipeId],
    references: [recipes.id],
  }),
}));

export const cuisinesRelations = relations(cuisines, ({ many }) => ({
  recipes: many(recipeCuisines),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  recipes: many(recipeCategories),
}));

export const cookingToolsRelations = relations(cookingTools, ({ many }) => ({
  recipes: many(recipeTools),
}));

export const keywordsRelations = relations(keywords, ({ many }) => ({
  recipes: many(recipeKeywords),
}));

export const recipeCuisinesRelations = relations(recipeCuisines, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeCuisines.recipeId],
    references: [recipes.id],
  }),
  cuisine: one(cuisines, {
    fields: [recipeCuisines.cuisineId],
    references: [cuisines.id],
  }),
}));

export const recipeCategoriesRelations = relations(recipeCategories, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeCategories.recipeId],
    references: [recipes.id],
  }),
  category: one(categories, {
    fields: [recipeCategories.categoryId],
    references: [categories.id],
  }),
}));

export const recipeToolsRelations = relations(recipeTools, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeTools.recipeId],
    references: [recipes.id],
  }),
  tool: one(cookingTools, {
    fields: [recipeTools.toolId],
    references: [cookingTools.id],
  }),
}));

export const recipeKeywordsRelations = relations(recipeKeywords, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeKeywords.recipeId],
    references: [recipes.id],
  }),
  keyword: one(keywords, {
    fields: [recipeKeywords.keywordId],
    references: [keywords.id],
  }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  recipeSaves: many(userRecipeSaves),
  tags: many(userTags),
  recipeTags: many(userRecipeTags),
  subscription: one(userSubscriptions),
  voiceSessions: many(voiceSessions),
}));

export const userRecipeSavesRelations = relations(userRecipeSaves, ({ one }) => ({
  user: one(users, {
    fields: [userRecipeSaves.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [userRecipeSaves.recipeId],
    references: [recipes.id],
  }),
}));

export const userTagsRelations = relations(userTags, ({ one, many }) => ({
  user: one(users, {
    fields: [userTags.userId],
    references: [users.id],
  }),
  recipeTags: many(userRecipeTags),
}));

export const userRecipeTagsRelations = relations(userRecipeTags, ({ one }) => ({
  user: one(users, {
    fields: [userRecipeTags.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [userRecipeTags.recipeId],
    references: [recipes.id],
  }),
  tag: one(userTags, {
    fields: [userRecipeTags.tagId],
    references: [userTags.id],
  }),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
}));

export const voiceSessionsRelations = relations(voiceSessions, ({ one }) => ({
  user: one(users, {
    fields: [voiceSessions.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [voiceSessions.recipeId],
    references: [recipes.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  events: many(jobEvents),
}));

export const jobEventsRelations = relations(jobEvents, ({ one }) => ({
  job: one(jobs, {
    fields: [jobEvents.jobId],
    references: [jobs.id],
  }),
}));

// Export types
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type RecipeInstruction = typeof recipeInstructions.$inferSelect;
export type RecipeNutrients = typeof recipeNutrients.$inferSelect;
export type RecipeRelevance = typeof recipeRelevance.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserRecipeSave = typeof userRecipeSaves.$inferSelect;
export type UserTag = typeof userTags.$inferSelect;
export type UserRecipeTag = typeof userRecipeTags.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type VoiceSession = typeof voiceSessions.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobEvent = typeof jobEvents.$inferSelect;
