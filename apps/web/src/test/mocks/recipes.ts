import { RecipeWithUserData, RecipeBase, UserTag, RecipeFull } from '../../types'

/**
 * Factory function to create properly typed mock UserTag
 */
export const createMockUserTag = (overrides?: Partial<UserTag>): UserTag => ({
  id: 'tag1',
  userId: 'user1',
  name: '#Dinner',
  color: '#FF5733',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  usageCount: 5,
  ...overrides,
})

/**
 * Factory function to create properly typed mock RecipeFull
 */
export const createMockRecipeFull = (overrides?: Partial<RecipeFull>): RecipeFull => ({
  id: 'recipe1',
  title: 'Spaghetti Carbonara',
  ingredients: ['pasta', 'eggs', 'bacon', 'parmesan'],
  instructions: ['Boil pasta', 'Cook bacon', 'Mix eggs and cheese', 'Combine'],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  summary: 'Classic Italian pasta dish',
  imageUrl: 'https://example.com/carbonara.jpg',
  prepTime: '10 mins',
  cookTime: '15 mins',
  servings: '4',
  ...overrides,
})

/**
 * Factory function to create properly typed mock RecipeWithUserData
 */
export const createMockRecipeWithUserData = (
  overrides?: Partial<RecipeWithUserData>
): RecipeWithUserData => ({
  ...createMockRecipeFull(),
  userTags: [createMockUserTag()],
  isSaved: true,
  savedAt: '2025-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Factory function to create properly typed mock RecipeBase
 */
export const createMockRecipeBase = (overrides?: Partial<RecipeBase>): RecipeBase => ({
  id: 'recipe1',
  title: 'Spaghetti Carbonara',
  summary: 'Classic Italian pasta dish',
  imageUrl: 'https://example.com/carbonara.jpg',
  prepTime: '10 mins',
  cookTime: '15 mins',
  servings: '4',
  ...overrides,
})

// Legacy exports for backwards compatibility
export const mockRecipe = createMockRecipeWithUserData()
export const mockRecipeBase = createMockRecipeBase()
export const mockSavedRecipes: RecipeBase[] = [
  createMockRecipeBase(),
  createMockRecipeBase({
    id: 'recipe2',
    title: 'Chicken Tikka Masala',
  }),
]

