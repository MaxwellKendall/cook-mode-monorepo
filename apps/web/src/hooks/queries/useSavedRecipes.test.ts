import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSavedRecipes } from './useSavedRecipes'
import { createTestQueryClient, createWrapper } from '../../test/utils/test-utils'
import * as recipeService from '../../services/recipeService'
import { mockSavedRecipes } from '../../test/mocks'

vi.mock('../../services/recipeService')

describe('useSavedRecipes', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  it('fetches saved recipes successfully', async () => {
    const mockResponse = { success: true, data: mockSavedRecipes }
    vi.mocked(recipeService.getUserSavedRecipes).mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => useSavedRecipes('user1'),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockSavedRecipes)
    expect(recipeService.getUserSavedRecipes).toHaveBeenCalledWith('user1', 1, 100, false, false, undefined)
  })

  it('does not fetch when userId is undefined', async () => {
    const { result } = renderHook(
      () => useSavedRecipes(undefined),
      { wrapper: createWrapper(queryClient) }
    )

    expect(result.current.data).toBeUndefined()
    expect(recipeService.getUserSavedRecipes).not.toHaveBeenCalled()
  })
})

