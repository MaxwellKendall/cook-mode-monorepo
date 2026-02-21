import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleItem } from '../../services/groceryListService'

export function useToggleGroceryItem(token?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      itemId,
      checked,
    }: {
      listId: string
      itemId: string
      checked: boolean
    }) => {
      const response = await toggleItem(listId, itemId, checked, token)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to toggle item')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groceryList', variables.listId] })
    },
  })
}
