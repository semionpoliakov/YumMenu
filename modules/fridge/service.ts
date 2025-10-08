import { DEFAULT_USER_ID } from '@/domain/users/constants';
import { notFound } from '@/lib/errors';
import { createId } from '@/lib/ids';

import { ingredientsRepository } from '../ingredients/repo';

import {
  fridgeRepository,
  type FridgeInsertData,
  type FridgeItemRecord,
  type FridgeUpdateData,
} from './repo';

import type { FridgeItemCreateInput, FridgeItemDto, FridgeItemUpdateInput } from '@/contracts';

const FRIDGE_ITEM_NOT_FOUND_MESSAGE = 'Fridge item not found';
const INGREDIENT_NOT_FOUND_MESSAGE = 'Ingredient not found';

const buildTransientItem = (params: {
  id?: string;
  name: string;
  unit: FridgeItemDto['unit'];
  createdAt?: string;
}): FridgeItemDto => {
  return {
    id: params.id ?? createId(),
    name: params.name,
    quantity: 0,
    unit: params.unit,
    createdAt: params.createdAt ?? new Date().toISOString(),
  };
};

const toFridgeItemDto = (record: FridgeItemRecord): FridgeItemDto => ({
  id: record.id,
  name: record.name,
  quantity: record.quantity,
  unit: record.unit,
  createdAt: record.createdAt,
});

export const fridgeService = {
  async list(): Promise<FridgeItemDto[]> {
    const items = await fridgeRepository.list(DEFAULT_USER_ID);
    return items.map(toFridgeItemDto);
  },

  async upsert(payload: FridgeItemCreateInput): Promise<FridgeItemDto> {
    const ingredient = await ingredientsRepository.findById(DEFAULT_USER_ID, payload.ingredientId);
    if (!ingredient) {
      throw notFound(INGREDIENT_NOT_FOUND_MESSAGE);
    }

    const existing = await fridgeRepository.findByIngredient(DEFAULT_USER_ID, payload.ingredientId);

    if (payload.quantity === 0) {
      if (existing) {
        await fridgeRepository.delete(DEFAULT_USER_ID, existing.id);
        const item = toFridgeItemDto(existing);
        return { ...item, quantity: 0 };
      }
      return buildTransientItem({ name: ingredient.name, unit: ingredient.unit });
    }

    if (existing) {
      const updates: FridgeUpdateData = {
        quantity: payload.quantity,
      };
      const updated = await fridgeRepository.update(DEFAULT_USER_ID, existing.id, updates);
      if (!updated) {
        throw notFound(FRIDGE_ITEM_NOT_FOUND_MESSAGE);
      }
      return toFridgeItemDto(updated);
    }

    const data: FridgeInsertData = {
      id: createId(),
      ingredientId: payload.ingredientId,
      quantity: payload.quantity,
    };
    const inserted = await fridgeRepository.insert(DEFAULT_USER_ID, data);
    return toFridgeItemDto(inserted);
  },

  async update(id: string, payload: FridgeItemUpdateInput): Promise<FridgeItemDto> {
    const existing = await fridgeRepository.findById(DEFAULT_USER_ID, id);
    if (!existing) {
      throw notFound(FRIDGE_ITEM_NOT_FOUND_MESSAGE);
    }

    if (payload.quantity === 0) {
      await fridgeRepository.delete(DEFAULT_USER_ID, id);
      const item = toFridgeItemDto(existing);
      return { ...item, quantity: 0 };
    }

    const updates: FridgeUpdateData = {
      quantity: payload.quantity,
    };
    const updated = await fridgeRepository.update(DEFAULT_USER_ID, id, updates);
    if (!updated) {
      throw notFound(FRIDGE_ITEM_NOT_FOUND_MESSAGE);
    }
    return toFridgeItemDto(updated);
  },

  async delete(id: string): Promise<void> {
    const existing = await fridgeRepository.findById(DEFAULT_USER_ID, id);
    if (!existing) {
      throw notFound(FRIDGE_ITEM_NOT_FOUND_MESSAGE);
    }
    await fridgeRepository.delete(DEFAULT_USER_ID, id);
  },
};
