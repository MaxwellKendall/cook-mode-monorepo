import { useQuery } from '@tanstack/react-query'
import { getUserSavedRecipes } from '../../services/recipeService'
import { RecipeBase } from '../../types'

export function useSavedRecipes(
  userId: string | undefined, 
  tagIds?: string[]
) {
  return useQuery({
    queryKey: ['savedRecipes', userId, tagIds],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')
      
      const response = await getUserSavedRecipes(userId, 1, 100, false, false, tagIds)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch saved recipes')
      }
      
      return response.data as RecipeBase[]
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute (saved recipes change more frequently)
  })
}

