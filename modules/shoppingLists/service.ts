import { notFound } from '@/lib/errors';

import { shoppingListsRepository } from './repo';

import type { ShoppingListItemDto, ShoppingListWithItemsDto } from '@/contracts';

const DEFAULT_USER_ID = 'demo-user';
const SHOPPING_LIST_NOT_FOUND_MESSAGE = 'Shopping list not found';
const SHOPPING_LIST_ITEM_NOT_FOUND_MESSAGE = 'Shopping list item not found';

export const shoppingListsService = {
  async get(id: string): Promise<ShoppingListWithItemsDto> {
    const shoppingList = await shoppingListsRepository.findById(DEFAULT_USER_ID, id);
    if (!shoppingList) {
      throw notFound(SHOPPING_LIST_NOT_FOUND_MESSAGE);
    }
    return shoppingList;
  },

  async updateItem(
    shoppingListId: string,
    itemId: string,
    bought: boolean,
  ): Promise<ShoppingListItemDto> {
    const updated = await shoppingListsRepository.updateItemBought(
      DEFAULT_USER_ID,
      shoppingListId,
      itemId,
      bought,
    );
    if (!updated) {
      throw notFound(SHOPPING_LIST_ITEM_NOT_FOUND_MESSAGE);
    }
    return updated;
  },

  async delete(id: string): Promise<void> {
    const deleted = await shoppingListsRepository.delete(DEFAULT_USER_ID, id);
    if (!deleted) {
      throw notFound(SHOPPING_LIST_NOT_FOUND_MESSAGE);
    }
  },
};
