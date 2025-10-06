import { and, asc, eq, inArray, ilike, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { dishIngredients, dishes, ingredients, menuItems, menus } from '@/db/schema';

import type {
  DishDto,
  DishIngredientRefDto,
  DishWithIngredientsDto,
  IngredientDto,
} from '@/contracts';

type DbClient = typeof db;
type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = DbClient | TransactionClient;

export type DishInsertData = Omit<typeof dishes.$inferInsert, 'createdAt' | 'userId'>;
export type DishUpdateData = Partial<
  Omit<typeof dishes.$inferInsert, 'id' | 'userId' | 'createdAt'>
>;
export type DishIngredientInsert = typeof dishIngredients.$inferInsert;

const getClient = (client?: DbOrTx): DbOrTx => client ?? db;

const toDishDto = (row: typeof dishes.$inferSelect): DishDto => ({
  id: row.id,
  name: row.name,
  mealType: row.mealType,
  isActive: row.isActive,
  tags: row.tags ?? [],
  createdAt: row.createdAt.toISOString(),
});

const toDishIngredientDto = (
  row: typeof dishIngredients.$inferSelect,
  ingredientUnits: Map<string, IngredientDto['unit']>,
): DishIngredientRefDto => ({
  ingredientId: row.ingredientId,
  quantity: Number(row.quantity),
  unit: ingredientUnits.get(row.ingredientId) ?? ('pcs' as IngredientDto['unit']),
});

const hydrateDishes = (
  dishesRows: (typeof dishes.$inferSelect)[],
  ingredientRows: (typeof dishIngredients.$inferSelect)[],
  ingredientUnits: Map<string, IngredientDto['unit']>,
): DishWithIngredientsDto[] => {
  const ingredientMap = new Map<string, DishIngredientRefDto[]>();
  ingredientRows.forEach((row) => {
    const current = ingredientMap.get(row.dishId) ?? [];
    current.push(toDishIngredientDto(row, ingredientUnits));
    ingredientMap.set(row.dishId, current);
  });

  return dishesRows.map((row) => ({
    ...toDishDto(row),
    ingredients: ingredientMap.get(row.id) ?? [],
  }));
};

export const dishesRepository = {
  async getIngredientUnits(ingredientIds: string[]): Promise<Map<string, IngredientDto['unit']>> {
    if (ingredientIds.length === 0) {
      return new Map();
    }
    const rows = await db
      .select({ id: ingredients.id, unit: ingredients.unit })
      .from(ingredients)
      .where(inArray(ingredients.id, ingredientIds));
    return new Map(rows.map((row) => [row.id, row.unit] as const));
  },
  async list(userId: string): Promise<DishWithIngredientsDto[]> {
    const rows = await db.query.dishes.findMany({
      where: eq(dishes.userId, userId),
      orderBy: asc(dishes.createdAt),
    });
    if (rows.length === 0) {
      return [];
    }
    const ingredientRows = await db
      .select()
      .from(dishIngredients)
      .where(
        inArray(
          dishIngredients.dishId,
          rows.map((row) => row.id),
        ),
      );
    const ingredientUnits = await this.getIngredientUnits(
      Array.from(new Set(ingredientRows.map((row) => row.ingredientId))),
    );
    return hydrateDishes(rows, ingredientRows, ingredientUnits);
  },

  async findById(userId: string, id: string): Promise<DishWithIngredientsDto | null> {
    const row = await db.query.dishes.findFirst({
      where: (fields, { and }) => and(eq(fields.userId, userId), eq(fields.id, id)),
    });
    if (!row) {
      return null;
    }
    const ingredientRows = await db
      .select()
      .from(dishIngredients)
      .where(eq(dishIngredients.dishId, id));
    const ingredientUnits = await this.getIngredientUnits(
      Array.from(new Set(ingredientRows.map((row) => row.ingredientId))),
    );
    return {
      ...toDishDto(row),
      ingredients: ingredientRows.map((row) => toDishIngredientDto(row, ingredientUnits)),
    };
  },

  async findByName(userId: string, name: string): Promise<DishDto | null> {
    const row = await db.query.dishes.findFirst({
      where: (fields, { and }) => and(eq(fields.userId, userId), ilike(fields.name, name)),
    });
    return row ? toDishDto(row) : null;
  },

  async insertDish(client: DbOrTx, userId: string, data: DishInsertData): Promise<DishDto> {
    const [row] = await getClient(client)
      .insert(dishes)
      .values({ ...data, userId })
      .returning();
    if (!row) {
      throw new Error('Failed to create dish');
    }
    return toDishDto(row);
  },

  async updateDish(
    client: DbOrTx,
    userId: string,
    id: string,
    data: DishUpdateData,
  ): Promise<DishDto | null> {
    if (Object.keys(data).length === 0) {
      const row = await db.query.dishes.findFirst({
        where: (fields, { and }) => and(eq(fields.userId, userId), eq(fields.id, id)),
      });
      return row ? toDishDto(row) : null;
    }

    const [row] = await getClient(client)
      .update(dishes)
      .set(data)
      .where(and(eq(dishes.id, id), eq(dishes.userId, userId)))
      .returning();
    return row ? toDishDto(row) : null;
  },

  async replaceIngredients(
    client: DbOrTx,
    dishId: string,
    items: DishIngredientInsert[],
  ): Promise<void> {
    const dbClient = getClient(client);
    await dbClient.delete(dishIngredients).where(eq(dishIngredients.dishId, dishId));
    if (items.length === 0) {
      return;
    }
    await dbClient.insert(dishIngredients).values(items);
  },

  async delete(client: DbOrTx, userId: string, id: string): Promise<void> {
    await getClient(client)
      .delete(dishes)
      .where(and(eq(dishes.id, id), eq(dishes.userId, userId)));
  },

  async countMenuUsage(userId: string, dishId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<string>`count(*)` })
      .from(menuItems)
      .innerJoin(menus, eq(menus.id, menuItems.menuId))
      .where(and(eq(menuItems.dishId, dishId), eq(menus.userId, userId)));
    return Number(result?.count ?? 0);
  },
};
