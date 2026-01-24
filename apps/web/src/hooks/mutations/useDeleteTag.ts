import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteUserTag } from '../../services/tagService'

export function useDeleteTag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      tagId 
    }: { 
      userId: string
      tagId: string
    }) => {
      const response = await deleteUserTag(userId, tagId)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete tag')
      }
      
      return response
    },
    onSuccess: (_, variables) => {
      // Invalidate saved recipes and tags
      queryClient.invalidateQueries({ queryKey: ['savedRecipes', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['userTags', variables.userId] })
    },
  })
}

