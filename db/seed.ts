import { DEFAULT_USER_ID } from '@/domain/users/constants';

import { db, postgresClient } from './client';
import { dishes, dishIngredients, ingredients } from './schema';

import type { DishTag, Unit } from '@/contracts';

async function seedIngredients() {
  const pantryStaples: Array<{ id: string; name: string; unit: Unit }> = [
    { id: 'ingredient-olive-oil', name: 'Olive Oil', unit: 'ml' },
    { id: 'ingredient-garlic', name: 'Garlic', unit: 'pcs' },
    { id: 'ingredient-tomato', name: 'Tomato', unit: 'pcs' },
  ];

  for (const staple of pantryStaples) {
    await db
      .insert(ingredients)
      .values({
        id: staple.id,
        name: staple.name,
        unit: staple.unit,
        userId: DEFAULT_USER_ID,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: ingredients.id,
        set: {
          name: staple.name,
          unit: staple.unit,
          isActive: true,
        },
      });
  }

  return pantryStaples;
}

async function seedDishes(ingredientIds: string[]) {
  const simpleDishId = 'dish-tomato-garlic-pasta';
  const tags: DishTag[] = ['salad'];

  await db
    .insert(dishes)
    .values({
      id: simpleDishId,
      name: 'Tomato Garlic Pasta',
      mealType: 'dinner',
      userId: DEFAULT_USER_ID,
      isActive: true,
      tags,
      description: 'Simple tomato and garlic pasta.',
    })
    .onConflictDoUpdate({
      target: dishes.id,
      set: {
        name: 'Tomato Garlic Pasta',
        mealType: 'dinner',
        isActive: true,
        tags,
        description: 'Simple tomato and garlic pasta.',
      },
    });

  await db
    .insert(dishIngredients)
    .values(
      ingredientIds.map((ingredientId) => ({
        dishId: simpleDishId,
        ingredientId,
        quantity: ingredientId === 'ingredient-olive-oil' ? 30 : 2,
      })),
    )
    .onConflictDoNothing({
      target: [dishIngredients.dishId, dishIngredients.ingredientId],
    });

  console.info('Seeded dishes with ingredient references:', ingredientIds);
}

async function main() {
  console.info('Starting database seed...');

  const staples = await seedIngredients();
  await seedDishes(staples.map((item) => item.id));

  console.info('Seeding completed successfully.');
}

async function run() {
  try {
    await main();
  } catch (error) {
    console.error('Seeding failed:', error);
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
