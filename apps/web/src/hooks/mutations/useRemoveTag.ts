import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeTagFromRecipe } from '../../services/tagService'

export function useRemoveTag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      recipeId, 
      tagId,
      usageCount
    }: { 
      userId: string
      recipeId: string
      tagId: string
      usageCount?: number
    }) => {
      const response = await removeTagFromRecipe(userId, recipeId, tagId, usageCount)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove tag')
      }
      
      return response
    },
    onSuccess: (_, variables) => {
      // Invalidate both saved recipes and tags (tag might be auto-deleted)
      queryClient.invalidateQueries({ queryKey: ['savedRecipes', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId, variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['userTags', variables.userId] })
    },
  })
}

