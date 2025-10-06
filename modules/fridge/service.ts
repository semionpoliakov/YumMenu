import { notFound } from '@/lib/errors';
import { createId } from '@/lib/ids';

import { ingredientsRepository } from '../ingredients/repo';

import { fridgeRepository, type FridgeInsertData, type FridgeUpdateData } from './repo';

import type { FridgeItemCreateInput, FridgeItemDto, FridgeItemUpdateInput } from '@/contracts';

const DEFAULT_USER_ID = 'demo-user';
const FRIDGE_ITEM_NOT_FOUND_MESSAGE = 'Fridge item not found';
const INGREDIENT_NOT_FOUND_MESSAGE = 'Ingredient not found';

const now = () => new Date().toISOString();

const buildTransientItem = (params: {
  id?: string;
  ingredientId: string;
  unit: FridgeItemDto['unit'];
  createdAt?: string;
}): FridgeItemDto => {
  const timestamp = now();
  return {
    id: params.id ?? createId(),
    ingredientId: params.ingredientId,
    quantity: 0,
    unit: params.unit,
    createdAt: params.createdAt ?? timestamp,
  };
};

export const fridgeService = {
  async list(): Promise<FridgeItemDto[]> {
    return fridgeRepository.list(DEFAULT_USER_ID);
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
        return { ...existing, quantity: 0 };
      }
      return buildTransientItem({ ingredientId: payload.ingredientId, unit: ingredient.unit });
    }

    if (existing) {
      const updates: FridgeUpdateData = {
        quantity: payload.quantity,
      };
      const updated = await fridgeRepository.update(DEFAULT_USER_ID, existing.id, updates);
      if (!updated) {
        throw notFound(FRIDGE_ITEM_NOT_FOUND_MESSAGE);
      }
      return updated;
    }

    const data: FridgeInsertData = {
      id: createId(),
      ingredientId: payload.ingredientId,
      quantity: payload.quantity,
    };
    return fridgeRepository.insert(DEFAULT_USER_ID, data);
  },

  async update(id: string, payload: FridgeItemUpdateInput): Promise<FridgeItemDto> {
    const existing = await fridgeRepository.findById(DEFAULT_USER_ID, id);
    if (!existing) {
      throw notFound(FRIDGE_ITEM_NOT_FOUND_MESSAGE);
    }

    if (payload.quantity === 0) {
      await fridgeRepository.delete(DEFAULT_USER_ID, id);
      return { ...existing, quantity: 0 };
    }

    const updates: FridgeUpdateData = {
      quantity: payload.quantity,
    };
    const updated = await fridgeRepository.update(DEFAULT_USER_ID, id, updates);
    if (!updated) {
      throw notFound(FRIDGE_ITEM_NOT_FOUND_MESSAGE);
    }
    return updated;
  },

  async delete(id: string): Promise<void> {
    const existing = await fridgeRepository.findById(DEFAULT_USER_ID, id);
    if (!existing) {
      throw notFound(FRIDGE_ITEM_NOT_FOUND_MESSAGE);
    }
    await fridgeRepository.delete(DEFAULT_USER_ID, id);
  },
};
