import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/data-access/client';
import {
  MENU_KEY,
  MENUS_KEY,
  SHOPPING_LIST_KEY,
  SHOPPING_LISTS_KEY,
} from '@/data-access/query-keys';
import { unwrap } from '@/data-access/utils';
import { showApiErrorToast, showSuccessToast } from '@/lib/toast';

import type {
  GenerateRequestInput,
  GenerateResponseDto,
  MenuDto,
  MenuItemDto,
  MenuListItemDto,
  MenuViewDto,
  ShoppingListViewDto,
} from '@/contracts';

const fetchMenus = async () => {
  const response = await apiClient.menus.list();
  return unwrap<MenuListItemDto[]>(response, [200]);
};

const fetchMenu = async (id: string) => {
  const response = await apiClient.menus.get({ params: { id } } as Parameters<
    typeof apiClient.menus.get
  >[0]);
  return unwrap<MenuViewDto>(response, [200]);
};

export const useMenusQuery = () =>
  useQuery({
    queryKey: MENUS_KEY,
    queryFn: fetchMenus,
  });

export const useMenuQuery = (id: string) =>
  useQuery({
    queryKey: MENU_KEY(id),
    queryFn: () => fetchMenu(id),
    enabled: Boolean(id),
  });

const syncMenuCaches = (queryClient: QueryClient, menu: MenuViewDto) => {
  queryClient.setQueryData(MENU_KEY(menu.id), menu);
  void queryClient.invalidateQueries({ queryKey: MENUS_KEY });
};

const syncShoppingListCache = (queryClient: QueryClient, shoppingList: ShoppingListViewDto) => {
  void queryClient.invalidateQueries({ queryKey: SHOPPING_LISTS_KEY });
  queryClient.setQueryData(SHOPPING_LIST_KEY(shoppingList.id), shoppingList);
};

export const useGenerateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GenerateRequestInput) => {
      const response = await apiClient.menus.generate({ body: input });
      return unwrap<GenerateResponseDto>(response, [201]);
    },
    onSuccess: (result) => {
      const menuView: MenuViewDto = {
        ...result.menu,
        items: result.items.map(({ id, mealType, dishName, locked, cooked }) => ({
          id,
          mealType,
          dishName,
          locked,
          cooked,
        })),
      };
      const shoppingListView: ShoppingListViewDto = {
        ...result.shoppingList,
        items: result.shoppingList.items,
      };
      syncMenuCaches(queryClient, menuView);
      syncShoppingListCache(queryClient, shoppingListView);
      showSuccessToast('Menu generated');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to generate menu');
    },
  });
};

export const useRegenerateMenu = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GenerateRequestInput) => {
      const response = await apiClient.menus.regenerate({
        params: { id },
        body: input,
      } as Parameters<typeof apiClient.menus.regenerate>[0]);
      return unwrap<GenerateResponseDto>(response, [200]);
    },
    onSuccess: (result) => {
      const menuView: MenuViewDto = {
        ...result.menu,
        items: result.items.map(({ id: itemId, mealType, dishName, locked, cooked }) => ({
          id: itemId,
          mealType,
          dishName,
          locked,
          cooked,
        })),
      };
      const shoppingListView: ShoppingListViewDto = {
        ...result.shoppingList,
        items: result.shoppingList.items,
      };
      syncMenuCaches(queryClient, menuView);
      syncShoppingListCache(queryClient, shoppingListView);
      showSuccessToast('Menu regenerated');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to regenerate menu');
    },
  });
};

export const useUpdateMenuItemCooked = (menuId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, cooked }: { itemId: string; cooked: boolean }) => {
      const response = await apiClient.menus.patchItem({
        params: { id: menuId, itemId },
        body: { cooked },
      } as Parameters<typeof apiClient.menus.patchItem>[0]);
      return unwrap<MenuItemDto>(response, [200]);
    },
    onSuccess: (item) => {
      queryClient.setQueryData<MenuViewDto>(MENU_KEY(menuId), (previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          items: previous.items.map((existing) =>
            existing.id === item.id
              ? { ...existing, cooked: item.cooked, locked: item.locked }
              : existing,
          ),
        };
      });
      showSuccessToast(item.cooked ? 'Marked as cooked' : 'Marked as not cooked');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to update menu item');
    },
  });
};

export const useLockMenuItems = (menuId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemIds, locked }: { itemIds: string[]; locked: boolean }) => {
      const response = await apiClient.menus.lockItems({
        params: { id: menuId },
        body: { itemIds, locked },
      } as Parameters<typeof apiClient.menus.lockItems>[0]);
      return unwrap<MenuItemDto[]>(response, [200]);
    },
    onSuccess: (items) => {
      queryClient.setQueryData<MenuViewDto>(MENU_KEY(menuId), (previous) => {
        if (!previous) return previous;
        const updates = new Map(items.map((item) => [item.id, item.locked]));
        return {
          ...previous,
          items: previous.items.map((existing) =>
            updates.has(existing.id)
              ? { ...existing, locked: updates.get(existing.id) ?? existing.locked }
              : existing,
          ),
        };
      });
      showSuccessToast('Lock state updated');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to update lock state');
    },
  });
};

export const useUpdateMenuStatus = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: MenuDto['status']) => {
      return unwrap<MenuDto>(
        await apiClient.menus.updateStatus({
          params: { id },
          body: { status },
        } as Parameters<typeof apiClient.menus.updateStatus>[0]),
        [200],
      );
    },
    onSuccess: (menu) => {
      queryClient.setQueryData<MenuViewDto>(MENU_KEY(id), (previous) =>
        previous ? { ...previous, status: menu.status } : previous,
      );
      void queryClient.invalidateQueries({ queryKey: MENUS_KEY });
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LISTS_KEY });
      showSuccessToast('Menu status updated');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to update menu status');
    },
  });
};

export const useDeleteMenu = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      unwrap<null>(
        await apiClient.menus.delete({ params: { id } } as Parameters<
          typeof apiClient.menus.delete
        >[0]),
        [204],
      );
      return id;
    },
    onSuccess: (deletedId) => {
      void queryClient.invalidateQueries({ queryKey: MENUS_KEY });
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LISTS_KEY });
      void queryClient.removeQueries({ queryKey: MENU_KEY(deletedId) });
      showSuccessToast('Menu deleted');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to delete menu');
    },
  });
};
