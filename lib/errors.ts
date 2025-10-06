import { ZodError } from 'zod';

import type { ErrorCodeType } from '@/contracts';

export type AppErrorCode = ErrorCodeType;

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AppError';
  }
}

export const createError = (code: AppErrorCode, message?: string) => new AppError(code, message);

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

const statusByCode: Record<AppErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  DUPLICATE_NAME: 409,
  HAS_DEPENDENCIES: 409,
  INSUFFICIENT_DISHES: 409,
  UNKNOWN: 500,
};

export const toHttpError = (error: unknown) => {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        code: 'VALIDATION_ERROR' as const,
        message: error.message,
      },
    };
  }

  if (isAppError(error)) {
    const status = statusByCode[error.code] ?? 500;
    return {
      status,
      body: {
        code: error.code,
        message: error.message,
      },
    };
  }

  return {
    status: 500,
    body: {
      code: 'UNKNOWN' as const,
      message: 'Internal server error',
    },
  };
};

export const notFound = (message?: string) => new AppError('NOT_FOUND', message);
export const duplicateName = (message?: string) => new AppError('DUPLICATE_NAME', message);
export const hasDependencies = (message?: string) => new AppError('HAS_DEPENDENCIES', message);
export const insufficientDishes = (message?: string) =>
  new AppError('INSUFFICIENT_DISHES', message);
