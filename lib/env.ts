import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z
    .string({ invalid_type_error: 'DATABASE_URL must be a string.' })
    .url('DATABASE_URL must be a valid URL.'),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
});

if (!parsed.success) {
  const formatted = parsed.error.format() as Record<string, { _errors?: string[] }>;
  const messages: string[] = Object.entries(formatted)
    .filter(([key]) => key !== '_errors')
    .flatMap(([, value]) => value._errors ?? []);
  const details = messages.length > 0 ? messages.join(', ') : 'Unknown validation error';
  throw new Error(`Invalid environment variables: ${details}`);
}

export const env = parsed.data;

export type AppEnv = typeof env;
