import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRemoveTag } from './useRemoveTag'
import { createTestQueryClient, createWrapper } from '../../test/utils/test-utils'
import { createMockSuccessResponse } from '../../test/mocks'
import * as tagService from '../../services/tagService'

vi.mock('../../services/tagService')

describe('useRemoveTag', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  it('successfully removes a tag from a recipe', async () => {
    const mockResponse = createMockSuccessResponse()
    vi.mocked(tagService.removeTagFromRecipe).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useRemoveTag(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      userId: 'user1',
      recipeId: 'recipe1',
      tagId: 'tag1',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(tagService.removeTagFromRecipe).toHaveBeenCalledWith('user1', 'recipe1', 'tag1')
  })

  it('invalidates all related queries on success', async () => {
    const mockResponse = createMockSuccessResponse()
    vi.mocked(tagService.removeTagFromRecipe).mockResolvedValue(mockResponse)

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRemoveTag(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      userId: 'user1',
      recipeId: 'recipe1',
      tagId: 'tag1',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    // Should invalidate saved recipes, recipe, AND user tags (tag might be deleted)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['savedRecipes', 'user1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recipe', 'recipe1', 'user1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['userTags', 'user1'] })
  })
})

