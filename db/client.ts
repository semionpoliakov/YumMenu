import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '@/lib/env';

const pgClient = postgres(env.DATABASE_URL, { max: 1 });

export const db = drizzle(pgClient);

export const postgresClient = pgClient;
