import { db } from '@/db/client';
import { DEFAULT_USER_ID } from '@/domain/users/constants';
import { duplicateName, hasDependencies, notFound } from '@/lib/errors';
import { createId } from '@/lib/ids';

import { ingredientsRepository } from '../ingredients/repo';

import {
  dishesRepository,
  type DishIngredientInsert,
  type DishInsertData,
  type DishWithIngredientsRecord,
  type DishUpdateData,
} from './repo';

import type {
  DishCreateInput,
  DishDto,
  DishIngredientInputDto,
  DishTag,
  DishUpdateInput,
  DishWithIngredientsDto,
} from '@/contracts';

const DISH_UNIQUE_MESSAGE = 'Dish name must be unique';
const DISH_NOT_FOUND_MESSAGE = 'Dish not found';
const INGREDIENT_NOT_FOUND_MESSAGE = 'Referenced ingredient not found';

const normalizeName = (name: string) => name.trim();
const normalizeTags = (tags?: DishTag[]) => (tags ? Array.from(new Set(tags)) : []);

const ensureIngredientsExist = async (ingredientRefs: DishIngredientInputDto[]) => {
  const ids = Array.from(new Set(ingredientRefs.map((item) => item.ingredientId)));
  const found = await ingredientsRepository.findAllByIds(DEFAULT_USER_ID, ids);
  if (found.length !== ids.length) {
    throw notFound(INGREDIENT_NOT_FOUND_MESSAGE);
  }
};

const toIngredientInserts = (
  dishId: string,
  items: DishIngredientInputDto[],
): DishIngredientInsert[] =>
  items.map((item) => ({
    dishId,
    ingredientId: item.ingredientId,
    quantity: item.qtyPerServing,
  }));

const toDishWithIngredients = ({
  ingredients,
  ...rest
}: DishWithIngredientsRecord): DishWithIngredientsDto => ({
  ...rest,
  ingredients: ingredients.map(({ name, qtyPerServing, unit }) => ({
    name,
    qtyPerServing,
    unit,
  })),
});

export const dishesService = {
  async list(): Promise<DishWithIngredientsDto[]> {
    const dishes = await dishesRepository.list(DEFAULT_USER_ID);
    return dishes.map(toDishWithIngredients);
  },

  async create(payload: DishCreateInput): Promise<DishDto> {
    const name = normalizeName(payload.name);
    const existing = await dishesRepository.findByName(DEFAULT_USER_ID, name);
    if (existing) {
      throw duplicateName(DISH_UNIQUE_MESSAGE);
    }

    await ensureIngredientsExist(payload.ingredients);

    const dishId = createId();
    const insertData: DishInsertData = {
      id: dishId,
      name,
      mealType: payload.mealType,
      isActive: payload.isActive ?? true,
      tags: normalizeTags(payload.tags),
      description: payload.description ?? '',
    };

    const dish = await db.transaction(async (tx) => {
      const created = await dishesRepository.insertDish(tx, DEFAULT_USER_ID, insertData);
      await dishesRepository.replaceIngredients(
        tx,
        dishId,
        toIngredientInserts(dishId, payload.ingredients),
      );
      return created;
    });

    return dish;
  },

  async update(id: string, payload: DishUpdateInput): Promise<DishDto> {
    const current = await dishesRepository.findById(DEFAULT_USER_ID, id);
    if (!current) {
      throw notFound(DISH_NOT_FOUND_MESSAGE);
    }

    const updates: DishUpdateData = {};

    if (payload.name !== undefined) {
      const name = normalizeName(payload.name);
      if (name !== current.name) {
        const existing = await dishesRepository.findByName(DEFAULT_USER_ID, name);
        if (existing && existing.id !== id) {
          throw duplicateName(DISH_UNIQUE_MESSAGE);
        }
      }
      updates.name = name;
    }

    if (payload.mealType !== undefined) {
      updates.mealType = payload.mealType;
    }

    if (payload.isActive !== undefined) {
      updates.isActive = payload.isActive;
    }

    if (payload.tags !== undefined) {
      updates.tags = normalizeTags(payload.tags);
    }

    if (payload.description !== undefined) {
      updates.description = payload.description.trim();
    }

    const ingredients = payload.ingredients;
    if (ingredients !== undefined) {
      await ensureIngredientsExist(ingredients);
    }

    const updated = await db.transaction(async (tx) => {
      const dish = await dishesRepository.updateDish(tx, DEFAULT_USER_ID, id, updates);
      if (!dish) {
        throw notFound(DISH_NOT_FOUND_MESSAGE);
      }
      if (ingredients !== undefined) {
        await dishesRepository.replaceIngredients(tx, id, toIngredientInserts(id, ingredients));
      }
      return dish;
    });

    return updated;
  },

  async delete(id: string): Promise<void> {
    const current = await dishesRepository.findById(DEFAULT_USER_ID, id);
    if (!current) {
      throw notFound(DISH_NOT_FOUND_MESSAGE);
    }

    const usage = await dishesRepository.countMenuUsage(DEFAULT_USER_ID, id);
    if (usage > 0) {
      throw hasDependencies('Dish is used in menus');
    }

    await db.transaction(async (tx) => {
      await dishesRepository.replaceIngredients(tx, id, []);
      await dishesRepository.delete(tx, DEFAULT_USER_ID, id);
    });
  },
};
