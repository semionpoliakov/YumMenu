import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { fridgeItems, ingredients } from '@/db/schema';

import type { Unit } from '@/contracts';

type FridgeRow = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  createdAt: Date;
  unit: Unit;
};

export type FridgeItemRecord = {
  id: string;
  ingredientId: string;
  name: string;
  quantity: number;
  unit: Unit;
  createdAt: string;
};

const mapFridgeItemRecord = (row: FridgeRow): FridgeItemRecord => ({
  id: row.id,
  ingredientId: row.ingredientId,
  name: row.ingredientName,
  quantity: Number(row.quantity),
  unit: row.unit,
  createdAt: row.createdAt.toISOString(),
});

const selectFridgeRow = {
  id: fridgeItems.id,
  ingredientId: fridgeItems.ingredientId,
  ingredientName: ingredients.name,
  quantity: fridgeItems.quantity,
  createdAt: fridgeItems.createdAt,
  unit: ingredients.unit,
};

export type FridgeInsertData = Omit<typeof fridgeItems.$inferInsert, 'userId' | 'createdAt'>;

export type FridgeUpdateData = Partial<
  Omit<typeof fridgeItems.$inferInsert, 'id' | 'userId' | 'createdAt'>
>;

export const fridgeRepository = {
  async list(userId: string): Promise<FridgeItemRecord[]> {
    const rows = await db
      .select(selectFridgeRow)
      .from(fridgeItems)
      .innerJoin(ingredients, eq(fridgeItems.ingredientId, ingredients.id))
      .where(eq(fridgeItems.userId, userId))
      .orderBy(asc(fridgeItems.createdAt));
    return rows.map(mapFridgeItemRecord);
  },

  async findById(userId: string, id: string): Promise<FridgeItemRecord | null> {
    const row = await db
      .select(selectFridgeRow)
      .from(fridgeItems)
      .innerJoin(ingredients, eq(fridgeItems.ingredientId, ingredients.id))
      .where(and(eq(fridgeItems.userId, userId), eq(fridgeItems.id, id)))
      .limit(1);
    return row[0] ? mapFridgeItemRecord(row[0]) : null;
  },

  async findByIngredient(userId: string, ingredientId: string): Promise<FridgeItemRecord | null> {
    const row = await db
      .select(selectFridgeRow)
      .from(fridgeItems)
      .innerJoin(ingredients, eq(fridgeItems.ingredientId, ingredients.id))
      .where(and(eq(fridgeItems.userId, userId), eq(fridgeItems.ingredientId, ingredientId)))
      .limit(1);
    return row[0] ? mapFridgeItemRecord(row[0]) : null;
  },

  async insert(userId: string, data: FridgeInsertData): Promise<FridgeItemRecord> {
    const [row] = await db
      .insert(fridgeItems)
      .values({ ...data, userId })
      .returning();
    if (!row) {
      throw new Error('Failed to create fridge item');
    }
    const [withUnit] = await db
      .select(selectFridgeRow)
      .from(fridgeItems)
      .innerJoin(ingredients, eq(fridgeItems.ingredientId, ingredients.id))
      .where(and(eq(fridgeItems.userId, userId), eq(fridgeItems.id, row.id)))
      .limit(1);
    if (!withUnit) {
      throw new Error('Failed to load fridge item');
    }
    return mapFridgeItemRecord(withUnit);
  },

  async update(
    userId: string,
    id: string,
    data: FridgeUpdateData,
  ): Promise<FridgeItemRecord | null> {
    const [row] = await db
      .update(fridgeItems)
      .set(data)
      .where(and(eq(fridgeItems.id, id), eq(fridgeItems.userId, userId)))
      .returning();
    if (!row) {
      return null;
    }
    const [withUnit] = await db
      .select(selectFridgeRow)
      .from(fridgeItems)
      .innerJoin(ingredients, eq(fridgeItems.ingredientId, ingredients.id))
      .where(and(eq(fridgeItems.userId, userId), eq(fridgeItems.id, id)))
      .limit(1);
    return withUnit ? mapFridgeItemRecord(withUnit) : null;
  },

  async delete(userId: string, id: string): Promise<void> {
    await db.delete(fridgeItems).where(and(eq(fridgeItems.id, id), eq(fridgeItems.userId, userId)));
  },
};
