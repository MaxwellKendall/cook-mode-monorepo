import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRecipe } from './useRecipe'
import { createTestQueryClient, createWrapper } from '../../test/utils/test-utils'
import * as recipeService from '../../services/recipeService'
import { mockRecipe } from '../../test/mocks'

vi.mock('../../services/recipeService')

describe('useRecipe', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  it('fetches a recipe successfully', async () => {
    const mockResponse = { success: true, data: mockRecipe }
    vi.mocked(recipeService.getRecipeById).mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => useRecipe('recipe1', 'user1'),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockRecipe)
    expect(recipeService.getRecipeById).toHaveBeenCalledWith('recipe1', 'user1')
  })

  it('does not fetch when recipeId is undefined', async () => {
    const { result } = renderHook(
      () => useRecipe(undefined, 'user1'),
      { wrapper: createWrapper(queryClient) }
    )

    expect(result.current.data).toBeUndefined()
    expect(recipeService.getRecipeById).not.toHaveBeenCalled()
  })

  it('handles errors correctly', async () => {
    const mockResponse = { success: false, error: 'Recipe not found' }
    vi.mocked(recipeService.getRecipeById).mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => useRecipe('invalid-id', 'user1'),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })
})

