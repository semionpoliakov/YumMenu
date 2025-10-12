import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/data-access/client';
import { DISHES_KEY } from '@/data-access/query-keys';
import { unwrap } from '@/data-access/utils';
import { showApiErrorToast, showSuccessToast } from '@/lib/toast';

import type {
  DishCreateInput,
  DishDto,
  DishUpdateInput,
  DishWithIngredientsDto,
} from '@/contracts';

const fetchDishes = async () => {
  const response = await apiClient.dishes.list();
  return unwrap<DishWithIngredientsDto[]>(response, [200]);
};

export const useDishesQuery = () =>
  useQuery({
    queryKey: DISHES_KEY,
    queryFn: fetchDishes,
  });

export const useCreateDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DishCreateInput) => {
      const response = await apiClient.dishes.create({ body: input });
      return unwrap<DishDto>(response, [201]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DISHES_KEY });
      showSuccessToast('Dish created');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to create dish');
    },
  });
};

export const useUpdateDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: DishUpdateInput }) => {
      const response = await apiClient.dishes.update({
        params: { id },
        body: input,
      } as Parameters<typeof apiClient.dishes.update>[0]);
      return unwrap<DishDto>(response, [200]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DISHES_KEY });
      showSuccessToast('Dish updated');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to update dish');
    },
  });
};

export const useDeleteDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.dishes.delete({
        params: { id },
      } as Parameters<typeof apiClient.dishes.delete>[0]);
      unwrap<null>(response, [204]);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DISHES_KEY });
      showSuccessToast('Dish deleted');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to delete dish');
    },
  });
};
