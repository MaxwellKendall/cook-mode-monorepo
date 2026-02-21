import { useMutation } from '@tanstack/react-query'
import { generateWeeklyPlan, type WeeklyPlanPreferences } from '../../services/weeklyPlanService'

export function useGenerateWeeklyPlan() {
  return useMutation({
    mutationFn: async ({
      preferences,
      userId,
      anonymousSessionId,
    }: {
      preferences: WeeklyPlanPreferences
      userId?: string
      anonymousSessionId?: string
    }) => {
      const response = await generateWeeklyPlan(preferences, { userId, anonymousSessionId })
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate weekly plan')
      }
      return response.data
    },
  })
}
