import { createError } from './errors';

import type { ZodSchema } from 'zod';

export const parseJson = async <T = unknown>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createError('VALIDATION_ERROR', 'Invalid JSON body');
    }
    throw error;
  }
};

export const parseBody = async <T>(request: Request, schema: ZodSchema<T>): Promise<T> => {
  const json = await parseJson(request);
  return schema.parse(json);
};

export const parseQuery = <T>(request: Request, schema: ZodSchema<T>): T => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  return schema.parse(query);
};
