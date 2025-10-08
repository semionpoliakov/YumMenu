import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { DishTagEnum, MealTypeEnum, StatusEnum, UnitEnum } from '../domain/common/enums';

export const unitEnum = pgEnum('unit', UnitEnum);
export const mealTypeEnum = pgEnum('meal_type', MealTypeEnum);
export const statusEnum = pgEnum('status', StatusEnum);
export const dishTagEnum = pgEnum('dish_tag', DishTagEnum);

const ts = (name: string) =>
  timestamp(name, { withTimezone: false, mode: 'date' })
    .notNull()
    .default(sql`now()`);

export const ingredients = pgTable(
  'ingredients',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    unit: unitEnum('unit').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: ts('created_at'),
  },
  (table) => [
    uniqueIndex('ingredients_user_lower_name_idx').on(table.userId, sql`lower(${table.name})`),
  ],
);

export const dishes = pgTable(
  'dishes',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    mealType: mealTypeEnum('meal_type').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    description: text('description').notNull().default(''),
    tags: dishTagEnum('tags')
      .array()
      .notNull()
      .default(sql`'{}'::dish_tag[]`),
    createdAt: ts('created_at'),
  },
  (table) => [
    uniqueIndex('dishes_user_lower_name_idx').on(table.userId, sql`lower(${table.name})`),
  ],
);

export const dishIngredients = pgTable(
  'dish_ingredients',
  {
    dishId: text('dish_id')
      .notNull()
      .references(() => dishes.id),
    ingredientId: text('ingredient_id')
      .notNull()
      .references(() => ingredients.id),
    quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull().$type<number>(),
  },
  (table) => [
    primaryKey({ columns: [table.dishId, table.ingredientId], name: 'dish_ingredients_pk' }),
    check('dish_ingredients_quantity_nonnegative', sql`quantity >= 0`),
    index('dish_ingredients_dish_idx').on(table.dishId),
    index('dish_ingredients_ing_idx').on(table.ingredientId),
  ],
);

export const fridgeItems = pgTable(
  'fridge_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    ingredientId: text('ingredient_id')
      .notNull()
      .references(() => ingredients.id),
    quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull().$type<number>(),
    createdAt: ts('created_at'),
  },
  (table) => [
    check('fridge_items_quantity_nonnegative', sql`quantity >= 0`),
    uniqueIndex('fridge_items_user_ingredient_idx').on(table.userId, table.ingredientId),
    index('fridge_items_ingredient_idx').on(table.ingredientId),
  ],
);

export const menus = pgTable('menus', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  status: statusEnum('status').notNull(),
  createdAt: ts('created_at'),
});

export const menuItems = pgTable(
  'menu_items',
  {
    id: text('id').primaryKey(),
    menuId: text('menu_id')
      .notNull()
      .references(() => menus.id),
    mealType: mealTypeEnum('meal_type').notNull(),
    dishId: text('dish_id')
      .notNull()
      .references(() => dishes.id),
    locked: boolean('locked').notNull().default(false),
    cooked: boolean('cooked').notNull().default(false),
  },
  (table) => [
    uniqueIndex('menu_items_menu_dish_uq').on(table.menuId, table.dishId),
    index('menu_items_dish_idx').on(table.dishId),
  ],
);

export const shoppingLists = pgTable(
  'shopping_lists',
  {
    id: text('id').primaryKey(),
    menuId: text('menu_id')
      .notNull()
      .references(() => menus.id),
    status: statusEnum('status').notNull().default('draft'),
    createdAt: ts('created_at'),
  },
  (table) => [uniqueIndex('shopping_lists_menu_unique_idx').on(table.menuId)],
);

export const shoppingListItems = pgTable(
  'shopping_list_items',
  {
    id: text('id').primaryKey(),
    shoppingListId: text('shopping_list_id')
      .notNull()
      .references(() => shoppingLists.id),
    ingredientId: text('ingredient_id')
      .notNull()
      .references(() => ingredients.id),
    quantity: numeric('quantity', { precision: 12, scale: 3 }).notNull().$type<number>(),
    bought: boolean('bought').notNull().default(false),
  },
  (table) => [
    check('shopping_list_items_quantity_nonnegative', sql`quantity >= 0`),
    index('shopping_list_items_list_idx').on(table.shoppingListId),
    index('shopping_list_items_ing_idx').on(table.ingredientId),
  ],
);
