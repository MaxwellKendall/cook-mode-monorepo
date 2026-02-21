import { useMutation } from '@tanstack/react-query';
import { generateSingleMeal, type SingleMealPreferences } from '../../services/singleMealService';

export function useGenerateSingleMeal() {
  return useMutation({
    mutationFn: async ({
      preferences,
      userId,
      anonymousSessionId,
    }: {
      preferences: SingleMealPreferences;
      userId?: string;
      anonymousSessionId?: string;
    }) => {
      const response = await generateSingleMeal(preferences, { userId, anonymousSessionId });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to generate meal');
      }
      return response.data;
    },
  });
}
