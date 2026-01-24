import { useQuery } from '@tanstack/react-query'
import { getUserTags } from '../../services/tagService'
import { UserTag } from '../../services/tagService'

export function useUserTags(userId: string | undefined) {
  return useQuery({
    queryKey: ['userTags', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')
      
      const response = await getUserTags(userId, true)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch user tags')
      }
      
      return response.data as UserTag[]
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  })
}

