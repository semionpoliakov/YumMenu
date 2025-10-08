import { z } from 'zod';

import { parseBody } from '@/lib/http';

import { shoppingListsService } from './service';

import type {
  ShoppingListItemDto,
  ShoppingListListItemDto,
  ShoppingListViewDto,
} from '@/contracts';

const updateItemBodySchema = z.object({ bought: z.boolean() });

export const shoppingListsController = {
  async list(): Promise<ShoppingListListItemDto[]> {
    return shoppingListsService.list();
  },

  async get(_request: Request, params: { id: string }): Promise<ShoppingListViewDto> {
    return shoppingListsService.get(params.id);
  },

  async updateItem(
    request: Request,
    params: { id: string; itemId: string },
  ): Promise<ShoppingListItemDto> {
    const body = await parseBody(request, updateItemBodySchema);
    return shoppingListsService.updateItem(params.id, params.itemId, body.bought);
  },

  async delete(_request: Request, params: { id: string }): Promise<void> {
    await shoppingListsService.delete(params.id);
  },
};
