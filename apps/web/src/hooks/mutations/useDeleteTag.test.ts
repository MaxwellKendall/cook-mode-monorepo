import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDeleteTag } from './useDeleteTag'
import { createTestQueryClient, createWrapper } from '../../test/utils/test-utils'
import { createMockSuccessResponse } from '../../test/mocks'
import * as tagService from '../../services/tagService'

vi.mock('../../services/tagService')

describe('useDeleteTag', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  it('successfully deletes a tag', async () => {
    const mockResponse = createMockSuccessResponse()
    vi.mocked(tagService.deleteUserTag).mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useDeleteTag(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      userId: 'user1',
      tagId: 'tag1',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(tagService.deleteUserTag).toHaveBeenCalledWith('user1', 'tag1')
  })

  it('invalidates savedRecipes and userTags queries on success', async () => {
    const mockResponse = createMockSuccessResponse()
    vi.mocked(tagService.deleteUserTag).mockResolvedValue(mockResponse)

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteTag(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      userId: 'user1',
      tagId: 'tag1',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['savedRecipes', 'user1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['userTags', 'user1'] })
  })
})

