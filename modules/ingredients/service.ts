import { duplicateName, hasDependencies, notFound } from '@/lib/errors';
import { createId } from '@/lib/ids';

import {
  ingredientsRepository,
  type IngredientActiveFilter,
  type IngredientInsertData,
  type IngredientUpdateData,
} from './repo';

import type { IngredientCreateInput, IngredientDto, IngredientUpdateInput } from '@/contracts';

const DEFAULT_USER_ID = 'demo-user';
const INGREDIENT_UNIQUE_MESSAGE = 'Ingredient name must be unique';
const INGREDIENT_NOT_FOUND_MESSAGE = 'Ingredient not found';

const normalizeName = (name: string) => name.trim();

export const ingredientsService = {
  async list(activeFilter: IngredientActiveFilter = 'all'): Promise<IngredientDto[]> {
    return ingredientsRepository.list(DEFAULT_USER_ID, activeFilter);
  },

  async create(payload: IngredientCreateInput): Promise<IngredientDto> {
    const name = normalizeName(payload.name);
    const existing = await ingredientsRepository.findByName(DEFAULT_USER_ID, name);
    if (existing) {
      throw duplicateName(INGREDIENT_UNIQUE_MESSAGE);
    }

    const data: IngredientInsertData = {
      id: createId(),
      name,
      unit: payload.unit,
      isActive: payload.isActive ?? true,
    };

    return ingredientsRepository.create(DEFAULT_USER_ID, data);
  },

  async update(id: string, payload: IngredientUpdateInput): Promise<IngredientDto> {
    const current = await ingredientsRepository.findById(DEFAULT_USER_ID, id);
    if (!current) {
      throw notFound(INGREDIENT_NOT_FOUND_MESSAGE);
    }

    const updates: IngredientUpdateData = {};

    if (payload.name !== undefined) {
      const name = normalizeName(payload.name);
      if (name !== current.name) {
        const existing = await ingredientsRepository.findByName(DEFAULT_USER_ID, name);
        if (existing && existing.id !== id) {
          throw duplicateName(INGREDIENT_UNIQUE_MESSAGE);
        }
      }
      updates.name = name;
    }

    if (payload.unit !== undefined) {
      updates.unit = payload.unit;
    }

    if (payload.isActive !== undefined) {
      updates.isActive = payload.isActive;
    }

    const updated = await ingredientsRepository.update(DEFAULT_USER_ID, id, updates);
    if (!updated) {
      throw notFound(INGREDIENT_NOT_FOUND_MESSAGE);
    }
    return updated;
  },

  async delete(id: string): Promise<void> {
    const current = await ingredientsRepository.findById(DEFAULT_USER_ID, id);
    if (!current) {
      throw notFound(INGREDIENT_NOT_FOUND_MESSAGE);
    }

    const usageCount = await ingredientsRepository.countDishUsage(DEFAULT_USER_ID, id);
    if (usageCount > 0) {
      throw hasDependencies('Ingredient is used by dishes');
    }

    await ingredientsRepository.delete(DEFAULT_USER_ID, id);
  },
};
