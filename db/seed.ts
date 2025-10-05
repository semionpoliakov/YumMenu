import { db, postgresClient } from './client';
import { dishes, ingredients } from './schema';

async function seedIngredients() {
  const pantryStaples = [
    { id: 'ingredient-olive-oil', name: 'Olive Oil', description: 'Extra virgin olive oil.' },
    { id: 'ingredient-garlic', name: 'Garlic', description: 'Fresh garlic cloves.' },
    {
      id: 'ingredient-tomato',
      name: 'Tomato',
      description: 'Ripe tomatoes for sauces and salads.',
    },
  ];

  for (const staple of pantryStaples) {
    await db
      .insert(ingredients)
      .values(staple)
      .onConflictDoUpdate({
        target: ingredients.id,
        set: {
          name: staple.name,
          description: staple.description,
        },
      });
  }

  return pantryStaples;
}

async function seedDishes(ingredientIds: string[]) {
  const simpleDishId = 'dish-tomato-garlic-pasta';

  await db
    .insert(dishes)
    .values({
      id: simpleDishId,
      name: 'Tomato Garlic Pasta',
      summary: 'Quick pasta with garlic-infused olive oil and fresh tomatoes.',
      instructions:
        'Cook pasta al dente. In a pan, sauté garlic in olive oil, add diced tomato, toss pasta, season with salt and pepper.',
    })
    .onConflictDoUpdate({
      target: dishes.id,
      set: {
        summary: 'Quick pasta with garlic-infused olive oil and fresh tomatoes.',
        instructions:
          'Cook pasta al dente. In a pan, sauté garlic in olive oil, add diced tomato, toss pasta, season with salt and pepper.',
      },
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
