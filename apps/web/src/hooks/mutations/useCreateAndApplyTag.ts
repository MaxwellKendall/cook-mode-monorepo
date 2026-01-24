import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUserTagAndApplyToRecipe } from '../../services/tagService'

export function useCreateAndApplyTag() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      recipeId, 
      tagName,
      color 
    }: { 
      userId: string
      recipeId: string
      tagName: string
      color?: string
    }) => {
      const response = await createUserTagAndApplyToRecipe(userId, recipeId, tagName, color)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create and apply tag')
      }
      
      return response
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['savedRecipes', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId, variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['userTags', variables.userId] })
    },
  })
}

