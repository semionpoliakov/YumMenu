import { DEFAULT_USER_ID } from '@/domain/users/constants';
import { duplicateName, hasDependencies, invalidData, notFound } from '@/lib/errors';
import { createId } from '@/lib/ids';

import {
  ingredientsRepository,
  type IngredientActiveFilter,
  type IngredientInsertData,
  type IngredientUpdateData,
} from './repo';

import type { IngredientCreateInput, IngredientDto, IngredientUpdateInput } from '@/contracts';

const INGREDIENT_UNIQUE_MESSAGE = 'Ingredient name must be unique';
const INGREDIENT_NOT_FOUND_MESSAGE = 'Ingredient not found';
const INGREDIENT_IN_USE_MESSAGE =
  'Ingredient is in use and cannot be modified/deleted. Consider isActive=false.';
const INGREDIENT_IN_USE_DELETE_MESSAGE =
  'Cannot delete ingredient that is in use. Set isActive=false instead.';
const INGREDIENT_UNIT_IMMUTABLE = 'Unit is immutable';

const normalizeName = (name: string) => name.trim();

const ensureIngredientUnused = async (
  ingredientId: string,
  message: string = INGREDIENT_IN_USE_MESSAGE,
) => {
  const [inDishes, inFridge, inShopping] = await Promise.all([
    ingredientsRepository.countDishIngredients(DEFAULT_USER_ID, ingredientId),
    ingredientsRepository.countFridgeItems(DEFAULT_USER_ID, ingredientId),
    ingredientsRepository.countShoppingListItems(DEFAULT_USER_ID, ingredientId),
  ]);
  if (inDishes + inFridge + inShopping > 0) {
    throw hasDependencies(message);
  }
};

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
        updates.name = name;
      }
    }

    if ((payload as { unit?: unknown }).unit !== undefined) {
      throw invalidData(INGREDIENT_UNIT_IMMUTABLE, 400);
    }

    if (payload.isActive !== undefined) {
      updates.isActive = payload.isActive;
    }

    if (Object.keys(updates).length === 0) {
      return current;
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

    await ensureIngredientUnused(id, INGREDIENT_IN_USE_DELETE_MESSAGE);

    await ingredientsRepository.delete(DEFAULT_USER_ID, id);
  },
};
