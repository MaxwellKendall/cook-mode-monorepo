import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRemoveSavedRecipe } from './useRemoveSavedRecipe'
import { createTestQueryClient, createWrapper } from '../../test/utils/test-utils'
import { createMockSuccessResponse } from '../../test/mocks'
import * as recipeService from '../../services/recipeService'

vi.mock('../../services/recipeService')

describe('useRemoveSavedRecipe', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  it('successfully removes a saved recipe', async () => {
    const mockResponse = createMockSuccessResponse()
    vi.mocked(recipeService.removeSavedRecipe).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useRemoveSavedRecipe(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      userId: 'user1',
      recipeId: 'recipe1',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(recipeService.removeSavedRecipe).toHaveBeenCalledWith('user1', 'recipe1')
  })

  it('invalidates saved recipes query on success', async () => {
    const mockResponse = createMockSuccessResponse()
    vi.mocked(recipeService.removeSavedRecipe).mockResolvedValue(mockResponse)

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRemoveSavedRecipe(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      userId: 'user1',
      recipeId: 'recipe1',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['savedRecipes', 'user1'] })
  })
})

