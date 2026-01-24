import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useApplyTag } from './useApplyTag'
import { createTestQueryClient, createWrapper } from '../../test/utils/test-utils'
import { createMockApplyTagResponse } from '../../test/mocks'
import * as tagService from '../../services/tagService'

// Mock the tag service
vi.mock('../../services/tagService')

describe('useApplyTag', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  it('successfully applies a tag to a recipe', async () => {
    // Arrange
    const mockResponse = createMockApplyTagResponse()
    vi.mocked(tagService.applyTagToRecipe).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useApplyTag(), {
      wrapper: createWrapper(queryClient),
    })

    // Act
    result.current.mutate({
      userId: 'user1',
      recipeId: 'recipe1',
      tagId: 'tag1',
    })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(tagService.applyTagToRecipe).toHaveBeenCalledWith('user1', 'recipe1', 'tag1')
  })

  it('invalidates correct queries on success', async () => {
    // Arrange
    const mockResponse = createMockApplyTagResponse()
    vi.mocked(tagService.applyTagToRecipe).mockResolvedValue(mockResponse)

    // Pre-populate cache
    queryClient.setQueryData(['savedRecipes', 'user1'], [{ id: 'recipe1' }])
    queryClient.setQueryData(['recipe', 'recipe1', 'user1'], { id: 'recipe1' })
    queryClient.setQueryData(['userTags', 'user1'], [{ id: 'tag1' }])

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useApplyTag(), {
      wrapper: createWrapper(queryClient),
    })

    // Act
    result.current.mutate({
      userId: 'user1',
      recipeId: 'recipe1',
      tagId: 'tag1',
    })

    // Assert - CRITICAL: This ensures tags update locally
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(invalidateSpy).toHaveBeenCalledWith({ 
      queryKey: ['savedRecipes', 'user1'] 
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ 
      queryKey: ['recipe', 'recipe1', 'user1'] 
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ 
      queryKey: ['userTags', 'user1'] 
    })
  })

  it('handles API errors correctly', async () => {
    // Arrange
    vi.mocked(tagService.applyTagToRecipe).mockResolvedValue(
      createMockApplyTagResponse({
        success: false,
        data: undefined,
        error: 'Tag not found',
      })
    )

    const { result } = renderHook(() => useApplyTag(), {
      wrapper: createWrapper(queryClient),
    })

    // Act
    result.current.mutate({
      userId: 'user1',
      recipeId: 'recipe1',
      tagId: 'invalid',
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(new Error('Tag not found'))
  })

  it('handles network errors correctly', async () => {
    // Arrange
    vi.mocked(tagService.applyTagToRecipe).mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => useApplyTag(), {
      wrapper: createWrapper(queryClient),
    })

    // Act
    result.current.mutate({
      userId: 'user1',
      recipeId: 'recipe1',
      tagId: 'tag1',
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(new Error('Network error'))
  })
})

