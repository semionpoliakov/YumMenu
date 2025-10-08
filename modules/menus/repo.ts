import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  dishes,
  ingredients,
  menuItems,
  menus,
  shoppingListItems,
  shoppingLists,
} from '@/db/schema';

import type {
  MenuDto,
  MenuItemDto,
  MenuItemViewDto,
  MenuListItemDto,
  ShoppingListDto,
  ShoppingListItemDto,
  ShoppingListWithItemsDto,
  MenuViewDto,
} from '@/contracts';

const toMenuDto = (row: typeof menus.$inferSelect): MenuDto => ({
  id: row.id,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
});

const toMenuItemDto = (row: typeof menuItems.$inferSelect): MenuItemDto => ({
  id: row.id,
  menuId: row.menuId,
  mealType: row.mealType,
  dishId: row.dishId,
  locked: row.locked,
  cooked: row.cooked,
});

const toShoppingListDto = (row: typeof shoppingLists.$inferSelect): ShoppingListDto => ({
  id: row.id,
  menuId: row.menuId,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
});

const shoppingListItemSelection = {
  id: shoppingListItems.id,
  shoppingListId: shoppingListItems.shoppingListId,
  ingredientId: shoppingListItems.ingredientId,
  quantity: shoppingListItems.quantity,
  bought: shoppingListItems.bought,
  unit: ingredients.unit,
};

type ShoppingListItemRow = {
  id: string;
  shoppingListId: string;
  ingredientId: string;
  quantity: number;
  bought: boolean;
  unit: ShoppingListItemDto['unit'];
};

const mapShoppingListItem = (row: ShoppingListItemRow): ShoppingListItemDto => ({
  id: row.id,
  shoppingListId: row.shoppingListId,
  ingredientId: row.ingredientId,
  quantity: Number(row.quantity),
  unit: row.unit,
  bought: row.bought,
});

type MenuListRow = {
  id: string;
  status: MenuDto['status'];
  createdAt: Date;
  itemsCount: number | string | null;
  lockedCount: number | string | null;
  cookedCount: number | string | null;
};

const mapMenuListItem = (row: MenuListRow): MenuListItemDto => ({
  id: row.id,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
  itemsCount: Number(row.itemsCount ?? 0),
  lockedCount: Number(row.lockedCount ?? 0),
  cookedCount: Number(row.cookedCount ?? 0),
});

type MenuItemViewRow = {
  id: string;
  mealType: MenuItemDto['mealType'];
  dishId: string;
  dishName: string;
  locked: boolean;
  cooked: boolean;
};

const mapMenuItemView = (row: MenuItemViewRow): MenuItemViewDto => ({
  id: row.id,
  mealType: row.mealType,
  dishId: row.dishId,
  dishName: row.dishName,
  locked: row.locked,
  cooked: row.cooked,
});

type DbClient = typeof db;
type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = DbClient | TransactionClient;

export type MenuInsertData = Omit<typeof menus.$inferInsert, 'createdAt' | 'userId'>;
export type MenuUpdateData = Partial<
  Omit<typeof menus.$inferInsert, 'id' | 'userId' | 'createdAt'>
>;
export type MenuItemInsertData = typeof menuItems.$inferInsert;
export type MenuItemUpdateData = Partial<Omit<typeof menuItems.$inferInsert, 'id' | 'menuId'>>;
export type ShoppingListInsertData = Omit<typeof shoppingLists.$inferInsert, 'createdAt'>;
export type ShoppingListItemInsertData = {
  id: string;
  shoppingListId: string;
  ingredientId: string;
  quantity: number;
  unit: ShoppingListItemDto['unit'];
  bought: boolean;
};

const getClient = (client?: DbOrTx): DbOrTx => client ?? db;

export const menusRepository = {
  async list(userId: string): Promise<MenuListItemDto[]> {
    const rows = await db
      .select({
        id: menus.id,
        status: menus.status,
        createdAt: menus.createdAt,
        itemsCount: sql<number>`coalesce(count(${menuItems.id}), 0)::int`,
        lockedCount: sql<number>`coalesce(sum(case when ${menuItems.locked} then 1 else 0 end), 0)::int`,
        cookedCount: sql<number>`coalesce(sum(case when ${menuItems.cooked} then 1 else 0 end), 0)::int`,
      })
      .from(menus)
      .leftJoin(menuItems, eq(menuItems.menuId, menus.id))
      .where(eq(menus.userId, userId))
      .groupBy(menus.id)
      .orderBy(desc(menus.createdAt), desc(menus.id));

    return rows.map(mapMenuListItem);
  },

  async findMenuView(userId: string, id: string): Promise<MenuViewDto | null> {
    const menuRow = await db.query.menus.findFirst({
      where: (fields, { and }) => and(eq(fields.userId, userId), eq(fields.id, id)),
    });
    if (!menuRow) {
      return null;
    }

    const itemRows = await db
      .select({
        id: menuItems.id,
        mealType: menuItems.mealType,
        dishId: menuItems.dishId,
        dishName: dishes.name,
        locked: menuItems.locked,
        cooked: menuItems.cooked,
      })
      .from(menuItems)
      .innerJoin(dishes, eq(menuItems.dishId, dishes.id))
      .where(eq(menuItems.menuId, id))
      .orderBy(asc(menuItems.id));

    return {
      id: menuRow.id,
      status: menuRow.status,
      createdAt: menuRow.createdAt.toISOString(),
      items: itemRows.map(mapMenuItemView),
    };
  },

  async findMenu(userId: string, id: string): Promise<MenuDto | null> {
    const row = await db.query.menus.findFirst({
      where: (fields, { and }) => and(eq(fields.userId, userId), eq(fields.id, id)),
    });
    return row ? toMenuDto(row) : null;
  },

  async findMenuWithDetails(
    userId: string,
    id: string,
  ): Promise<{
    menu: MenuDto;
    items: MenuItemDto[];
    shoppingList: ShoppingListWithItemsDto | null;
  } | null> {
    const menuRow = await db.query.menus.findFirst({
      where: (fields, { and }) => and(eq(fields.userId, userId), eq(fields.id, id)),
    });
    if (!menuRow) {
      return null;
    }

    const itemsRows = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.menuId, id))
      .orderBy(asc(menuItems.id));

    const shoppingListRow = await db.query.shoppingLists.findFirst({
      where: eq(shoppingLists.menuId, id),
    });

    let shoppingList: ShoppingListWithItemsDto | null = null;
    if (shoppingListRow) {
      const itemRows = await db
        .select(shoppingListItemSelection)
        .from(shoppingListItems)
        .innerJoin(ingredients, eq(shoppingListItems.ingredientId, ingredients.id))
        .where(eq(shoppingListItems.shoppingListId, shoppingListRow.id));
      shoppingList = {
        ...toShoppingListDto(shoppingListRow),
        items: itemRows.map(mapShoppingListItem),
      };
    }

    return {
      menu: toMenuDto(menuRow),
      items: itemsRows.map(toMenuItemDto),
      shoppingList,
    };
  },

  async insertMenu(client: DbOrTx, userId: string, data: MenuInsertData): Promise<MenuDto> {
    const [row] = await getClient(client)
      .insert(menus)
      .values({ ...data, userId })
      .returning();
    if (!row) {
      throw new Error('Failed to create menu');
    }
    return toMenuDto(row);
  },

  async updateMenu(
    client: DbOrTx,
    userId: string,
    id: string,
    data: MenuUpdateData,
  ): Promise<MenuDto | null> {
    const [row] = await getClient(client)
      .update(menus)
      .set(data)
      .where(and(eq(menus.id, id), eq(menus.userId, userId)))
      .returning();
    return row ? toMenuDto(row) : null;
  },

  async insertMenuItems(client: DbOrTx, items: MenuItemInsertData[]): Promise<MenuItemDto[]> {
    if (items.length === 0) {
      return [];
    }
    const rows = await getClient(client).insert(menuItems).values(items).returning();
    return rows.map(toMenuItemDto);
  },

  async deleteMenuItems(client: DbOrTx, menuId: string, itemIds?: string[]): Promise<void> {
    const dbClient = getClient(client);
    if (itemIds && itemIds.length > 0) {
      await dbClient
        .delete(menuItems)
        .where(and(eq(menuItems.menuId, menuId), inArray(menuItems.id, itemIds)));
      return;
    }
    await dbClient.delete(menuItems).where(eq(menuItems.menuId, menuId));
  },

  async findMenuItems(menuId: string): Promise<MenuItemDto[]> {
    const rows = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.menuId, menuId))
      .orderBy(asc(menuItems.id));
    return rows.map(toMenuItemDto);
  },

  async setMenuItemsLock(
    client: DbOrTx,
    menuId: string,
    itemIds: string[],
    locked: boolean,
  ): Promise<MenuItemDto[]> {
    if (itemIds.length === 0) {
      return [];
    }
    const rows = await getClient(client)
      .update(menuItems)
      .set({ locked })
      .where(and(eq(menuItems.menuId, menuId), inArray(menuItems.id, itemIds)))
      .returning();
    return rows.map(toMenuItemDto);
  },

  async updateMenuItem(
    client: DbOrTx,
    menuId: string,
    itemId: string,
    data: MenuItemUpdateData,
  ): Promise<MenuItemDto | null> {
    const [row] = await getClient(client)
      .update(menuItems)
      .set(data)
      .where(and(eq(menuItems.menuId, menuId), eq(menuItems.id, itemId)))
      .returning();
    return row ? toMenuItemDto(row) : null;
  },

  async insertShoppingList(client: DbOrTx, data: ShoppingListInsertData): Promise<ShoppingListDto> {
    const [row] = await getClient(client).insert(shoppingLists).values(data).returning();
    if (!row) {
      throw new Error('Failed to create shopping list');
    }
    return toShoppingListDto(row);
  },

  async updateShoppingList(
    client: DbOrTx,
    id: string,
    data: Partial<Omit<typeof shoppingLists.$inferInsert, 'id' | 'menuId' | 'createdAt'>>,
  ): Promise<ShoppingListDto | null> {
    const [row] = await getClient(client)
      .update(shoppingLists)
      .set(data)
      .where(eq(shoppingLists.id, id))
      .returning();
    return row ? toShoppingListDto(row) : null;
  },

  async replaceShoppingListItems(
    client: DbOrTx,
    shoppingListId: string,
    items: ShoppingListItemInsertData[],
  ): Promise<void> {
    const dbClient = getClient(client);
    await dbClient
      .delete(shoppingListItems)
      .where(eq(shoppingListItems.shoppingListId, shoppingListId));
    if (items.length === 0) {
      return;
    }
    const values = items.map(({ id, shoppingListId, ingredientId, quantity, bought }) => ({
      id,
      shoppingListId,
      ingredientId,
      quantity,
      bought,
    }));
    await dbClient.insert(shoppingListItems).values(values);
  },

  async deleteShoppingList(client: DbOrTx, menuId: string): Promise<void> {
    const dbClient = getClient(client);
    const shoppingListRow = await db.query.shoppingLists.findFirst({
      where: eq(shoppingLists.menuId, menuId),
    });
    if (!shoppingListRow) {
      return;
    }
    await dbClient
      .delete(shoppingListItems)
      .where(eq(shoppingListItems.shoppingListId, shoppingListRow.id));
    await dbClient.delete(shoppingLists).where(eq(shoppingLists.id, shoppingListRow.id));
  },

  async deleteMenu(client: DbOrTx, userId: string, id: string): Promise<void> {
    const dbClient = getClient(client);
    await this.deleteShoppingList(dbClient, id);
    await dbClient.delete(menuItems).where(eq(menuItems.menuId, id));
    await dbClient.delete(menus).where(and(eq(menus.id, id), eq(menus.userId, userId)));
  },

  async findShoppingListWithItems(id: string): Promise<ShoppingListWithItemsDto | null> {
    const row = await db.query.shoppingLists.findFirst({ where: eq(shoppingLists.id, id) });
    if (!row) {
      return null;
    }
    const itemsRows = await db
      .select(shoppingListItemSelection)
      .from(shoppingListItems)
      .innerJoin(ingredients, eq(shoppingListItems.ingredientId, ingredients.id))
      .where(eq(shoppingListItems.shoppingListId, id));
    return {
      ...toShoppingListDto(row),
      items: itemsRows.map(mapShoppingListItem),
    };
  },
};
