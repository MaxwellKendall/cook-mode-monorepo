import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveRecipeForUser } from '../../services/recipeService'

export function useSaveRecipe() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, recipeId }: { userId: string; recipeId: string }) => {
      const response = await saveRecipeForUser(userId, recipeId)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to save recipe')
      }
      
      return response
    },
    onSuccess: (_, variables) => {
      // Invalidate saved recipes to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['savedRecipes', variables.userId] })
    },
  })
}

