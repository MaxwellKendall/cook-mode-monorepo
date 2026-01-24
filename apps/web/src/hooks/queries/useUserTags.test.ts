import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useUserTags } from './useUserTags'
import { createTestQueryClient, createWrapper } from '../../test/utils/test-utils'
import * as tagService from '../../services/tagService'
import { mockTags } from '../../test/mocks'

vi.mock('../../services/tagService')

describe('useUserTags', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
  })

  it('fetches user tags successfully', async () => {
    const mockResponse = { success: true, data: mockTags }
    vi.mocked(tagService.getUserTags).mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () => useUserTags('user1'),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTags)
    expect(tagService.getUserTags).toHaveBeenCalledWith('user1', true)
  })

  it('does not fetch when userId is undefined', async () => {
    const { result } = renderHook(
      () => useUserTags(undefined),
      { wrapper: createWrapper(queryClient) }
    )

    expect(result.current.data).toBeUndefined()
    expect(tagService.getUserTags).not.toHaveBeenCalled()
  })
})

