import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute default
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: true, // Refetch when user returns to tab
    },
    mutations: {
      retry: 0, // Don't retry mutations by default
    },
  },
})

