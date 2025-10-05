import { db, postgresClient } from './client';
import { dishes, ingredients } from './schema';

async function clearTables() {
  console.info('Clearing tables: dishes, ingredients');
  await db.delete(dishes);
  await db.delete(ingredients);
}

async function run() {
  try {
    await clearTables();
    console.info('Database reset completed.');
  } catch (error) {
    console.error('Database reset failed:', error);
    process.exitCode = 1;
  } finally {
    try {
      await postgresClient.end({ timeout: 5 });
    } catch (closeError) {
      console.error('Failed to close database connection cleanly:', closeError);
    }
  }
}

void run();
