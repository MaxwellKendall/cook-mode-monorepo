/**
 * Typed factory functions for API response mocks
 * These ensure type safety when mocking service responses
 */

import type {
  TagResponse,
  CreateTagResponse,
  ApplyTagResponse,
  CreateTagAndApplyResponse,
  UserTag,
} from '../../services/tagService'
import type { ApiResponse } from '../../types/api'
import { createMockUserTag } from './recipes'

/**
 * Factory for TagResponse (list of tags)
 */
export const createMockTagResponse = (
  overrides?: Partial<TagResponse>
): TagResponse => ({
  success: true,
  data: [
    createMockUserTag({ id: 'tag1', name: 'Dinner' }),
    createMockUserTag({ id: 'tag2', name: 'Lunch' })
  ],
  ...overrides,
})

/**
 * Factory for CreateTagResponse (single tag)
 */
export const createMockCreateTagResponse = (
  overrides?: Partial<CreateTagResponse>
): CreateTagResponse => ({
  success: true,
  data: createMockUserTag(),
  ...overrides,
})

/**
 * Factory for ApplyTagResponse
 */
export const createMockApplyTagResponse = (
  overrides?: Partial<ApplyTagResponse>
): ApplyTagResponse => ({
  success: true,
  data: {
    id: 'recipe-tag-1',
    userId: 'user1',
    recipeId: 'recipe1',
    tagId: 'tag1',
    appliedAt: new Date('2025-01-01T00:00:00Z'),
  },
  ...overrides,
})

/**
 * Factory for CreateTagAndApplyResponse
 */
export const createMockCreateTagAndApplyResponse = (
  overrides?: Partial<CreateTagAndApplyResponse>
): CreateTagAndApplyResponse => ({
  success: true,
  data: {
    tag: createMockUserTag(),
    recipeTag: {
      id: 'recipe-tag-1',
      userId: 'user1',
      recipeId: 'recipe1',
      tagId: 'tag1',
      appliedAt: new Date('2025-01-01T00:00:00Z'),
    },
  },
  ...overrides,
})

/**
 * Generic success response factory (for simple operations like delete)
 */
export const createMockSuccessResponse = (
  overrides?: { success?: boolean; error?: string }
): { success: boolean; error?: string } => ({
  success: true,
  ...overrides,
})

/**
 * Generic error response factory
 */
export const createMockErrorResponse = <T = any>(
  error: string,
  code?: string
): ApiResponse<T> => ({
  success: false,
  error,
  code,
})

