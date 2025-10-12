import { toast } from '@/components/ui/use-toast';

import type { ErrorResponseDto } from '@/contracts';

export const showSuccessToast = (message: string) =>
  toast({
    title: 'Success',
    description: message,
  });

export const showErrorToast = (message: string) =>
  toast({
    variant: 'destructive',
    title: 'Error',
    description: message,
  });

export const showApiErrorToast = (error: unknown, fallbackMessage = 'Something went wrong') => {
  if (error && typeof error === 'object') {
    const maybeTsRestError = error as {
      status?: number;
      body?: Partial<ErrorResponseDto>;
    };
    if (maybeTsRestError.body?.message) {
      return showErrorToast(maybeTsRestError.body.message);
    }
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return showErrorToast((error as { message: string }).message);
    }
  }

  return showErrorToast(fallbackMessage);
};
