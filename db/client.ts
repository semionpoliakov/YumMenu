import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '@/lib/env';

import * as schema from './schema';

const NUMERIC_TYPE = 1700;

const pgClient = postgres(env.DATABASE_URL, {
  max: 1,
  transform: {
    value: {
      from: (value: unknown, column) => {
        if (column.type === NUMERIC_TYPE) {
          const numericValue = Number(value);
          return Number.isNaN(numericValue) ? value : numericValue;
        }
        return value;
      },
    },
  },
});

export const db = drizzle(pgClient, { schema });
export const postgresClient = pgClient;
