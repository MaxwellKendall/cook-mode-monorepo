import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addItem } from '../../services/groceryListService'

export function useAddGroceryItem(token?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      item,
    }: {
      listId: string
      item: { name: string; quantity?: string; category?: string }
    }) => {
      const response = await addItem(listId, item, token)
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add item')
      }
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groceryList', variables.listId] })
    },
  })
}
