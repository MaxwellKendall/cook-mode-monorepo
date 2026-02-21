import { useQuery } from '@tanstack/react-query'
import { getGroceryList, getGroceryListByPlan } from '../../services/groceryListService'

export function useGroceryList(id: string | undefined, token?: string) {
  return useQuery({
    queryKey: ['groceryList', id],
    queryFn: async () => {
      if (!id) throw new Error('List ID required')
      const response = await getGroceryList(id, token)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch grocery list')
      }
      return response.data
    },
    enabled: !!id,
    staleTime: 10 * 1000,
  })
}

export function useGroceryListByPlan(weeklyPlanId: string | undefined, token?: string) {
  return useQuery({
    queryKey: ['groceryList', 'byPlan', weeklyPlanId],
    queryFn: async () => {
      if (!weeklyPlanId) throw new Error('Weekly plan ID required')
      const response = await getGroceryListByPlan(weeklyPlanId, token)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch grocery list')
      }
      return response.data
    },
    enabled: !!weeklyPlanId,
    staleTime: 10 * 1000,
  })
}
