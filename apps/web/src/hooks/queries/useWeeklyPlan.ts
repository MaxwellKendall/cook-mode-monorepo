import { useQuery } from '@tanstack/react-query'
import { getWeeklyPlan, getWeeklyPlans, type WeeklyPlanStatus } from '../../services/weeklyPlanService'

export function useWeeklyPlan(id: string | undefined, token?: string) {
  return useQuery({
    queryKey: ['weeklyPlan', id],
    queryFn: async () => {
      if (!id) throw new Error('Plan ID required')
      const response = await getWeeklyPlan(id, token)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch weekly plan')
      }
      return response.data
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useWeeklyPlans(userId: string | undefined, status?: WeeklyPlanStatus, token?: string) {
  return useQuery({
    queryKey: ['weeklyPlans', userId, status],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')
      const response = await getWeeklyPlans(userId, status, token)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch weekly plans')
      }
      return response.data
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}
