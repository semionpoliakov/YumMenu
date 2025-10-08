import { DEFAULT_USER_ID } from '@/domain/users/constants';
import { notFound } from '@/lib/errors';

import { shoppingListsRepository } from './repo';

import type {
  ShoppingListItemDto,
  ShoppingListListItemDto,
  ShoppingListViewDto,
} from '@/contracts';

const SHOPPING_LIST_NOT_FOUND_MESSAGE = 'Shopping list not found';
const SHOPPING_LIST_ITEM_NOT_FOUND_MESSAGE = 'Shopping list item not found';

export const shoppingListsService = {
  async list(): Promise<ShoppingListListItemDto[]> {
    return shoppingListsRepository.list(DEFAULT_USER_ID);
  },

  async get(id: string): Promise<ShoppingListViewDto> {
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
