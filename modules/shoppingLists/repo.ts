import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { ingredients, menus, shoppingListItems, shoppingLists } from '@/db/schema';

import type {
  ShoppingListItemDto,
  ShoppingListItemViewDto,
  ShoppingListListItemDto,
  ShoppingListViewDto,
} from '@/contracts';

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

const shoppingListItemViewSelection = {
  id: shoppingListItems.id,
  ingredientId: shoppingListItems.ingredientId,
  ingredientName: ingredients.name,
  quantity: shoppingListItems.quantity,
  bought: shoppingListItems.bought,
};

type ShoppingListItemViewRow = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  bought: boolean;
};

const mapShoppingListItemView = (row: ShoppingListItemViewRow): ShoppingListItemViewDto => ({
  id: row.id,
  ingredientId: row.ingredientId,
  ingredientName: row.ingredientName,
  quantity: Number(row.quantity),
  bought: row.bought,
});

type ShoppingListListRow = {
  id: string;
  status: ShoppingListViewDto['status'];
  name: string;
  createdAt: Date;
};

const mapShoppingListListItem = (row: ShoppingListListRow): ShoppingListListItemDto => ({
  id: row.id,
  status: row.status,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
});

export const shoppingListsRepository = {
  async list(userId: string): Promise<ShoppingListListItemDto[]> {
    const rows = await db
      .select({
        id: shoppingLists.id,
        status: shoppingLists.status,
        name: shoppingLists.name,
        createdAt: shoppingLists.createdAt,
      })
      .from(shoppingLists)
      .innerJoin(menus, eq(menus.id, shoppingLists.menuId))
      .where(eq(menus.userId, userId))
      .orderBy(desc(shoppingLists.createdAt), desc(shoppingLists.id));

    return rows.map(mapShoppingListListItem);
  },

  async findById(userId: string, id: string): Promise<ShoppingListViewDto | null> {
    const shoppingListRow = await db
      .select({
        id: shoppingLists.id,
        menuId: shoppingLists.menuId,
        status: shoppingLists.status,
        name: shoppingLists.name,
        createdAt: shoppingLists.createdAt,
      })
      .from(shoppingLists)
      .innerJoin(menus, and(eq(menus.id, shoppingLists.menuId), eq(menus.userId, userId)))
      .where(eq(shoppingLists.id, id))
      .limit(1);

    const row = shoppingListRow[0];
    if (!row) {
      return null;
    }

    const items = await db
      .select(shoppingListItemViewSelection)
      .from(shoppingListItems)
      .innerJoin(ingredients, eq(shoppingListItems.ingredientId, ingredients.id))
      .where(eq(shoppingListItems.shoppingListId, id));

    return {
      id: row.id,
      menuId: row.menuId,
      status: row.status,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
      items: items.map(mapShoppingListItemView),
    };
  },

  async findItem(
    userId: string,
    shoppingListId: string,
    itemId: string,
  ): Promise<ShoppingListItemDto | null> {
    const rows = await db
      .select({
        ...shoppingListItemSelection,
        menuUserId: menus.userId,
      })
      .from(shoppingListItems)
      .innerJoin(shoppingLists, eq(shoppingLists.id, shoppingListItems.shoppingListId))
      .innerJoin(menus, eq(menus.id, shoppingLists.menuId))
      .innerJoin(ingredients, eq(shoppingListItems.ingredientId, ingredients.id))
      .where(
        and(eq(shoppingListItems.id, itemId), eq(shoppingListItems.shoppingListId, shoppingListId)),
      )
      .limit(1);

    const record = rows[0];
    if (!record || record.menuUserId !== userId) {
      return null;
    }
    const { menuUserId, ...item } = record;
    void menuUserId;
    return mapShoppingListItem(item);
  },

  async updateItemBought(
    userId: string,
    shoppingListId: string,
    itemId: string,
    bought: boolean,
  ): Promise<ShoppingListItemDto | null> {
    const existing = await this.findItem(userId, shoppingListId, itemId);
    if (!existing) {
      return null;
    }
    const [row] = await db
      .update(shoppingListItems)
      .set({ bought })
      .where(
        and(eq(shoppingListItems.id, itemId), eq(shoppingListItems.shoppingListId, shoppingListId)),
      )
      .returning();
    if (!row) {
      return null;
    }
    return this.findItem(userId, shoppingListId, itemId);
  },

  async delete(userId: string, id: string): Promise<boolean> {
    const shoppingList = await this.findById(userId, id);
    if (!shoppingList) {
      return false;
    }
    await db.delete(shoppingListItems).where(eq(shoppingListItems.shoppingListId, id));
    await db.delete(shoppingLists).where(eq(shoppingLists.id, id));
    return true;
  },
};
