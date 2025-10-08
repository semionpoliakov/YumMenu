import { createError } from './errors';

import type { ZodTypeAny, z } from 'zod';

export const parseJson = async (request: Request): Promise<unknown> => {
  try {
    return (await request.json()) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createError('VALIDATION_ERROR', 'Invalid JSON body');
    }
    throw error;
  }
};

export const parseBody = async <Schema extends ZodTypeAny>(
  request: Request,
  schema: Schema,
): Promise<z.output<Schema>> => {
  const json = await parseJson(request);

  const result = schema.safeParse(json);

  if (!result.success) {
    const errorMessage = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    throw createError('VALIDATION_ERROR', `Invalid request body: ${errorMessage}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result.data as z.output<Schema>;
};

export const parseQuery = <Schema extends ZodTypeAny>(
  request: Request,
  schema: Schema,
): z.output<Schema> => {
  const url = new URL(request.url);

  const query = Object.fromEntries(url.searchParams.entries());

  const result = schema.safeParse(query);

  if (!result.success) {
    const errorMessage = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    throw createError('VALIDATION_ERROR', `Invalid query parameters: ${errorMessage}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result.data as z.output<Schema>;
};
