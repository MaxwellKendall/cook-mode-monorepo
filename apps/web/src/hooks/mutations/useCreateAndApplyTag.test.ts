import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCreateAndApplyTag } from './useCreateAndApplyTag'
import { createTestQueryClient, createWrapper } from '../../test/utils/test-utils'
import { createMockCreateTagAndApplyResponse } from '../../test/mocks'
import * as tagService from '../../services/tagService'

vi.mock('../../services/tagService')

describe('useCreateAndApplyTag', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  it('creates and applies a new tag', async () => {
    const mockResponse = createMockCreateTagAndApplyResponse()
    vi.mocked(tagService.createUserTagAndApplyToRecipe).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useCreateAndApplyTag(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      userId: 'user1',
      recipeId: 'recipe1',
      tagName: 'Breakfast',
      color: '#FFD700',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(tagService.createUserTagAndApplyToRecipe).toHaveBeenCalledWith(
      'user1',
      'recipe1',
      'Breakfast',
      '#FFD700'
    )
  })

  it('invalidates all related queries after creating tag', async () => {
    const mockResponse = createMockCreateTagAndApplyResponse()
    vi.mocked(tagService.createUserTagAndApplyToRecipe).mockResolvedValue(mockResponse)

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateAndApplyTag(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      userId: 'user1',
      recipeId: 'recipe1',
      tagName: 'New Tag',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['savedRecipes', 'user1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recipe', 'recipe1', 'user1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['userTags', 'user1'] })
  })
})

