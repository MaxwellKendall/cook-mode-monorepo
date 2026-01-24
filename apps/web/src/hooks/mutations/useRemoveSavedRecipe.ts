import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeSavedRecipe } from '../../services/recipeService'

export function useRemoveSavedRecipe() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, recipeId }: { userId: string; recipeId: string }) => {
      const response = await removeSavedRecipe(userId, recipeId)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove saved recipe')
      }
      
      return response
    },
    onSuccess: (_, variables) => {
      // Invalidate saved recipes to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['savedRecipes', variables.userId] })
    },
  })
}

