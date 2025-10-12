import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/data-access/client';
import { INGREDIENTS_KEY } from '@/data-access/query-keys';
import { unwrap } from '@/data-access/utils';
import { showApiErrorToast, showSuccessToast } from '@/lib/toast';

import type { IngredientCreateInput, IngredientDto, IngredientUpdateInput } from '@/contracts';

export type IngredientActiveFilter = 'true' | 'false' | 'all';

const fetchIngredients = async (filter: IngredientActiveFilter) => {
  const response = await apiClient.ingredients.list({
    query: filter === 'all' ? {} : { active: filter },
  });
  return unwrap<IngredientDto[]>(response, [200]);
};

export const useIngredientsQuery = (filter: IngredientActiveFilter = 'all') =>
  useQuery({
    queryKey: [...INGREDIENTS_KEY, filter],
    queryFn: () => fetchIngredients(filter),
  });

export const useCreateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: IngredientCreateInput) => {
      const response = await apiClient.ingredients.create({ body: input });
      return unwrap<IngredientDto>(response, [201]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY });
      showSuccessToast('Ingredient saved');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to save ingredient');
    },
  });
};

export const useUpdateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: IngredientUpdateInput }) => {
      const response = await apiClient.ingredients.update({
        params: { id },
        body: input,
      } as Parameters<typeof apiClient.ingredients.update>[0]);
      return unwrap<IngredientDto>(response, [200]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY });
      showSuccessToast('Ingredient updated');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to update ingredient');
    },
  });
};

export const useDeleteIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.ingredients.delete({
        params: { id },
      } as Parameters<typeof apiClient.ingredients.delete>[0]);
      unwrap<null>(response, [204]);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY });
      showSuccessToast('Ingredient deleted');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to delete ingredient');
    },
  });
};
