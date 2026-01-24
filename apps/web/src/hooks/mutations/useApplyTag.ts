import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applyTagToRecipe } from '../../services/tagService'

export function useApplyTag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      recipeId, 
      tagId 
    }: { 
      userId: string
      recipeId: string
      tagId: string
    }) => {
      const response = await applyTagToRecipe(userId, recipeId, tagId)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to apply tag')
      }
      
      return response
    },
    onSuccess: (_, variables) => {
      // CRITICAL: Invalidate both saved recipes AND the individual recipe
      // This ensures tag assignment updates recipe state locally
      queryClient.invalidateQueries({ queryKey: ['savedRecipes', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId, variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['userTags', variables.userId] })
    },
  })
}

