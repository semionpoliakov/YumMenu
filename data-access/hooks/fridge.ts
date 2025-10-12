import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/data-access/client';
import { FRIDGE_KEY } from '@/data-access/query-keys';
import { unwrap } from '@/data-access/utils';
import { showApiErrorToast, showSuccessToast } from '@/lib/toast';

import type { FridgeItemCreateInput, FridgeItemDto, FridgeItemUpdateInput } from '@/contracts';

const fetchFridge = async () => {
  const response = await apiClient.fridge.list();
  return unwrap<FridgeItemDto[]>(response, [200]);
};

export const useFridgeQuery = () =>
  useQuery({
    queryKey: FRIDGE_KEY,
    queryFn: fetchFridge,
  });

export const useUpsertFridgeItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FridgeItemCreateInput) => {
      const response = await apiClient.fridge.upsert({ body: input });
      return unwrap<FridgeItemDto>(response, [200]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FRIDGE_KEY });
      showSuccessToast('Fridge updated');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to update fridge');
    },
  });
};

export const useUpdateFridgeItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: FridgeItemUpdateInput }) => {
      const response = await apiClient.fridge.update({
        params: { id },
        body: input,
      } as Parameters<typeof apiClient.fridge.update>[0]);
      return unwrap<FridgeItemDto>(response, [200]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FRIDGE_KEY });
      showSuccessToast('Fridge item updated');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to update fridge item');
    },
  });
};

export const useDeleteFridgeItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.fridge.delete({
        params: { id },
      } as Parameters<typeof apiClient.fridge.delete>[0]);
      unwrap<null>(response, [204]);
      return id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FRIDGE_KEY });
      showSuccessToast('Fridge item removed');
    },
    onError: (error) => {
      showApiErrorToast(error, 'Failed to remove fridge item');
    },
  });
};
