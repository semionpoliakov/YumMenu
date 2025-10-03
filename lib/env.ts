import { z } from 'zod';

const envSchema = z.object({
  TURSO_DATABASE_URL: z
    .string({ invalid_type_error: 'TURSO_DATABASE_URL must be a string.' })
    .url('TURSO_DATABASE_URL must be a valid URL.'),
  TURSO_AUTH_TOKEN: z
    .string({ invalid_type_error: 'TURSO_AUTH_TOKEN must be a string.' })
    .min(1, 'TURSO_AUTH_TOKEN is required.'),
});

const parsed = envSchema.safeParse({
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
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
