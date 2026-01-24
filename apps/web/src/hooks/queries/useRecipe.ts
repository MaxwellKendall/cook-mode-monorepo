import { useQuery } from '@tanstack/react-query'
import { getRecipeById } from '../../services/recipeService'
import { RecipeFull, RecipeWithUserData } from '../../types'

export function useRecipe(recipeId: string | undefined, userId?: string) {
  return useQuery({
    queryKey: ['recipe', recipeId, userId],
    queryFn: async () => {
      if (!recipeId) throw new Error('Recipe ID required')
      
      const response = await getRecipeById(recipeId, userId)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch recipe')
      }
      
      return response.data as RecipeFull | RecipeWithUserData
    },
    enabled: !!recipeId, // Only run if recipeId exists
    staleTime: 5 * 60 * 1000, // 5 minutes (preserves RecipeContext behavior)
  })
}

