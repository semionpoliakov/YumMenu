import { and, asc, desc, eq, inArray } from 'drizzle-orm';

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
  MenuItemViewDto,
  MenuListItemDto,
  ShoppingListItemDto,
  MenuViewDto,
} from '@/contracts';

const toMenuDto = (row: typeof menus.$inferSelect): MenuDto => ({
  id: row.id,
  status: row.status,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
});

export type MenuItemRecord = {
  id: string;
  menuId: string;
  mealType: (typeof menuItems.$inferSelect)['mealType'];
  dishId: string;
  locked: boolean;
  cooked: boolean;
};

const toMenuItemRecord = (row: typeof menuItems.$inferSelect): MenuItemRecord => ({
  id: row.id,
  menuId: row.menuId,
  mealType: row.mealType,
  dishId: row.dishId,
  locked: row.locked,
  cooked: row.cooked,
});

export type ShoppingListRecord = {
  id: string;
  menuId: string;
  status: (typeof shoppingLists.$inferSelect)['status'];
  name: string;
  createdAt: string;
};

const toShoppingListRecord = (row: typeof shoppingLists.$inferSelect): ShoppingListRecord => ({
  id: row.id,
  menuId: row.menuId,
  status: row.status,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
});

const shoppingListItemSelection = {
  id: shoppingListItems.id,
  shoppingListId: shoppingListItems.shoppingListId,
  ingredientId: shoppingListItems.ingredientId,
  ingredientName: ingredients.name,
  quantity: shoppingListItems.quantity,
  bought: shoppingListItems.bought,
  unit: ingredients.unit,
};

type ShoppingListItemRow = {
  id: string;
  shoppingListId: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  bought: boolean;
  unit: ShoppingListItemDto['unit'];
};

const mapShoppingListItem = (row: ShoppingListItemRow): ShoppingListItemDto => ({
  id: row.id,
  name: row.ingredientName,
  quantity: Number(row.quantity),
  unit: row.unit,
  bought: row.bought,
});

type MenuListRow = {
  id: string;
  status: MenuDto['status'];
  name: string;
  createdAt: Date;
};

const mapMenuListItem = (row: MenuListRow): MenuListItemDto => ({
  id: row.id,
  status: row.status,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
});

type MenuItemViewRow = {
  id: string;
  mealType: (typeof menuItems.$inferSelect)['mealType'];
  dishName: string;
  locked: boolean;
  cooked: boolean;
};

const mapMenuItemView = (row: MenuItemViewRow): MenuItemViewDto => ({
  id: row.id,
  mealType: row.mealType,
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

export type ShoppingListWithItemsRecord = ShoppingListRecord & {
  items: ShoppingListItemDto[];
};

const getClient = (client?: DbOrTx): DbOrTx => client ?? db;

export const menusRepository = {
  async list(userId: string): Promise<MenuListItemDto[]> {
    const rows = await db
      .select({
        id: menus.id,
        status: menus.status,
        name: menus.name,
        createdAt: menus.createdAt,
      })
      .from(menus)
      .where(eq(menus.userId, userId))
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
      name: menuRow.name,
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
    items: MenuItemRecord[];
    shoppingList: ShoppingListWithItemsRecord | null;
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

    let shoppingList: ShoppingListWithItemsRecord | null = null;
    if (shoppingListRow) {
      const itemRows = await db
        .select(shoppingListItemSelection)
        .from(shoppingListItems)
        .innerJoin(ingredients, eq(shoppingListItems.ingredientId, ingredients.id))
        .where(eq(shoppingListItems.shoppingListId, shoppingListRow.id));
      shoppingList = {
        ...toShoppingListRecord(shoppingListRow),
        items: itemRows.map(mapShoppingListItem),
      };
    }

    return {
      menu: toMenuDto(menuRow),
      items: itemsRows.map(toMenuItemRecord),
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

  async insertMenuItems(client: DbOrTx, items: MenuItemInsertData[]): Promise<MenuItemRecord[]> {
    if (items.length === 0) {
      return [];
    }
    const rows = await getClient(client).insert(menuItems).values(items).returning();
    return rows.map(toMenuItemRecord);
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

  async findMenuItems(menuId: string): Promise<MenuItemRecord[]> {
    const rows = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.menuId, menuId))
      .orderBy(asc(menuItems.id));
    return rows.map(toMenuItemRecord);
  },

  async setMenuItemsLock(
    client: DbOrTx,
    menuId: string,
    itemIds: string[],
    locked: boolean,
  ): Promise<MenuItemRecord[]> {
    if (itemIds.length === 0) {
      return [];
    }
    const rows = await getClient(client)
      .update(menuItems)
      .set({ locked })
      .where(and(eq(menuItems.menuId, menuId), inArray(menuItems.id, itemIds)))
      .returning();
    return rows.map(toMenuItemRecord);
  },

  async updateMenuItem(
    client: DbOrTx,
    menuId: string,
    itemId: string,
    data: MenuItemUpdateData,
  ): Promise<MenuItemRecord | null> {
    const [row] = await getClient(client)
      .update(menuItems)
      .set(data)
      .where(and(eq(menuItems.menuId, menuId), eq(menuItems.id, itemId)))
      .returning();
    return row ? toMenuItemRecord(row) : null;
  },

  async insertShoppingList(
    client: DbOrTx,
    data: ShoppingListInsertData,
  ): Promise<ShoppingListRecord> {
    const [row] = await getClient(client).insert(shoppingLists).values(data).returning();
    if (!row) {
      throw new Error('Failed to create shopping list');
    }
    return toShoppingListRecord(row);
  },

  async updateShoppingList(
    client: DbOrTx,
    id: string,
    data: Partial<Omit<typeof shoppingLists.$inferInsert, 'id' | 'menuId' | 'createdAt'>>,
  ): Promise<ShoppingListRecord | null> {
    const [row] = await getClient(client)
      .update(shoppingLists)
      .set(data)
      .where(eq(shoppingLists.id, id))
      .returning();
    return row ? toShoppingListRecord(row) : null;
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

  async findShoppingListWithItems(id: string): Promise<ShoppingListWithItemsRecord | null> {
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
      ...toShoppingListRecord(row),
      items: itemsRows.map(mapShoppingListItem),
    };
  },
};
