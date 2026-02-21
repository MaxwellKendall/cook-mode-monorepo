import { useMutation, useQueryClient } from '@tanstack/react-query'
import { swapMeal } from '../../services/weeklyPlanService'

export function useSwapMeal(token?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ planId, day }: { planId: string; day: number }) => {
      const response = await swapMeal(planId, day, token)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to swap meal')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['weeklyPlan', variables.planId] })
    },
  })
}
