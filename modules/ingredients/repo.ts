import { and, asc, eq, ilike, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  dishes,
  dishIngredients,
  fridgeItems,
  ingredients,
  menus,
  shoppingListItems,
  shoppingLists,
} from '@/db/schema';

import type { IngredientDto } from '@/contracts';

export type IngredientInsertData = Omit<typeof ingredients.$inferInsert, 'userId' | 'createdAt'>;
export type IngredientUpdateData = Partial<
  Omit<typeof ingredients.$inferInsert, 'id' | 'userId' | 'createdAt'>
>;

const mapIngredient = (row: typeof ingredients.$inferSelect): IngredientDto => ({
  id: row.id,
  name: row.name,
  unit: row.unit,
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
});

export type IngredientActiveFilter = 'all' | 'true' | 'false';

export const ingredientsRepository = {
  async list(userId: string, activeFilter: IngredientActiveFilter): Promise<IngredientDto[]> {
    const conditions = [eq(ingredients.userId, userId)];
    if (activeFilter === 'true') {
      conditions.push(eq(ingredients.isActive, true));
    }
    if (activeFilter === 'false') {
      conditions.push(eq(ingredients.isActive, false));
    }

    const rows = await db.query.ingredients.findMany({
      where: and(...conditions),
      orderBy: asc(ingredients.createdAt),
    });

    return rows.map(mapIngredient);
  },

  async findById(userId: string, id: string): Promise<IngredientDto | null> {
    const row = await db.query.ingredients.findFirst({
      where: (fields, { and }) => and(eq(fields.userId, userId), eq(fields.id, id)),
    });
    if (!row) {
      return null;
    }
    return mapIngredient(row);
  },

  async findAllByIds(userId: string, ids: string[]): Promise<IngredientDto[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db
      .select()
      .from(ingredients)
      .where(and(eq(ingredients.userId, userId), inArray(ingredients.id, ids)));
    return rows.map(mapIngredient);
  },

  async findByName(userId: string, name: string): Promise<IngredientDto | null> {
    const row = await db.query.ingredients.findFirst({
      where: (fields, { and }) => and(eq(fields.userId, userId), ilike(fields.name, name)),
    });
    if (!row) {
      return null;
    }
    return mapIngredient(row);
  },

  async create(userId: string, data: IngredientInsertData): Promise<IngredientDto> {
    const [row] = await db
      .insert(ingredients)
      .values({ ...data, userId })
      .returning();
    if (!row) {
      throw new Error('Failed to create ingredient');
    }
    return mapIngredient(row);
  },

  async update(
    userId: string,
    id: string,
    data: IngredientUpdateData,
  ): Promise<IngredientDto | null> {
    if (Object.keys(data).length === 0) {
      const current = await this.findById(userId, id);
      return current;
    }

    const [row] = await db
      .update(ingredients)
      .set(data)
      .where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)))
      .returning();
    if (!row) {
      return null;
    }
    return mapIngredient(row);
  },

  async delete(userId: string, id: string): Promise<void> {
    await db.delete(ingredients).where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)));
  },

  async countDishIngredients(userId: string, ingredientId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<string>`count(*)` })
      .from(dishIngredients)
      .innerJoin(dishes, eq(dishes.id, dishIngredients.dishId))
      .where(and(eq(dishIngredients.ingredientId, ingredientId), eq(dishes.userId, userId)));
    return Number(result?.count ?? 0);
  },

  async countFridgeItems(userId: string, ingredientId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<string>`count(*)` })
      .from(fridgeItems)
      .where(and(eq(fridgeItems.ingredientId, ingredientId), eq(fridgeItems.userId, userId)));
    return Number(result?.count ?? 0);
  },

  async countShoppingListItems(userId: string, ingredientId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<string>`count(*)` })
      .from(shoppingListItems)
      .innerJoin(shoppingLists, eq(shoppingLists.id, shoppingListItems.shoppingListId))
      .innerJoin(menus, eq(menus.id, shoppingLists.menuId))
      .where(and(eq(shoppingListItems.ingredientId, ingredientId), eq(menus.userId, userId)));
    return Number(result?.count ?? 0);
  },
};
