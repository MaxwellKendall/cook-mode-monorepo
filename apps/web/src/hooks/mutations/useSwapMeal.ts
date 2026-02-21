import { useMutation, useQueryClient } from '@tanstack/react-query'
import { swapMeal, markMealCooked, type WeeklyPlan, type WeeklyPlanMeal } from '../../services/weeklyPlanService'

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

export function useMarkMealCooked(token?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ planId, day }: { planId: string; day: number }) => {
      const response = await markMealCooked(planId, day, token)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to mark meal as cooked')
      }
      return response.data
    },
    onMutate: async ({ planId, day }) => {
      await queryClient.cancelQueries({ queryKey: ['weeklyPlan', planId] })
      const previous = queryClient.getQueryData<WeeklyPlan>(['weeklyPlan', planId])
      queryClient.setQueryData<WeeklyPlan>(['weeklyPlan', planId], (old) => {
        if (!old) return old
        return {
          ...old,
          meals: old.meals?.map((meal: WeeklyPlanMeal) =>
            meal.day === day ? { ...meal, cookedAt: new Date().toISOString() } : meal
          ),
        }
      })
      return { previous, planId }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['weeklyPlan', context.planId], context.previous)
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['weeklyPlan', variables.planId] })
      queryClient.invalidateQueries({ queryKey: ['weeklyPlans'] })
    },
  })
}
