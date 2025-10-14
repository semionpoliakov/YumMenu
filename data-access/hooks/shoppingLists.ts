import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/data-access/client';
import { SHOPPING_LIST_KEY, SHOPPING_LISTS_KEY } from '@/data-access/query-keys';
import { unwrap } from '@/data-access/utils';
import { showApiErrorToast, showSuccessToast } from '@/lib/toast';

import type {
  ShoppingListItemDto,
  ShoppingListListItemDto,
  ShoppingListViewDto,
} from '@/contracts';

const fetchShoppingLists = async () => {
  const response = await apiClient.shoppingLists.list();
  return unwrap<ShoppingListListItemDto[]>(response, [200]);
};

const fetchShoppingList = async (id: string) => {
  const response = await apiClient.shoppingLists.get({
    params: { id },
  } as Parameters<typeof apiClient.shoppingLists.get>[0]);
  return unwrap<ShoppingListViewDto>(response, [200]);
};

export const useShoppingListsQuery = () =>
  useQuery({
    queryKey: SHOPPING_LISTS_KEY,
    queryFn: fetchShoppingLists,
  });

export const useShoppingListQuery = (id: string) =>
  useQuery({
    queryKey: SHOPPING_LIST_KEY(id),
    queryFn: () => fetchShoppingList(id),
    enabled: Boolean(id),
  });

export const useToggleShoppingListItem = (listId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, bought }: { itemId: string; bought: boolean }) => {
      const response = await apiClient.shoppingLists.patchItem({
        params: { id: listId, itemId },
        body: { bought },
      } as Parameters<typeof apiClient.shoppingLists.patchItem>[0]);
      return unwrap<ShoppingListItemDto>(response, [200]);
    },
    onSuccess: (item) => {
      queryClient.setQueryData<ShoppingListViewDto>(SHOPPING_LIST_KEY(listId), (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          items: previous.items.map((existing) =>
            existing.id === item.id ? { ...existing, bought: item.bought } : existing,
          ),
        };
      });
      showSuccessToast(item.bought ? 'Marked as bought' : 'Marked as not bought');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to update shopping list item');
    },
  });
};
