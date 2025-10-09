import { and, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { menus, shoppingLists } from '@/db/schema';
import { calculateShoppingList, fillSlots } from '@/domain/generate';
import { buildDishPool, scoreByFridgeOverlap } from '@/domain/generate/generation';
import { DEFAULT_USER_ID } from '@/domain/users/constants';
import { insufficientDishes, invalidData, notFound } from '@/lib/errors';
import { createId } from '@/lib/ids';

import { dishesRepository, type DishWithIngredientsRecord } from '../dishes/repo';
import { fridgeRepository, type FridgeItemRecord } from '../fridge/repo';

import {
  menusRepository,
  type MenuItemInsertData,
  type MenuItemRecord,
  type ShoppingListItemInsertData,
  type ShoppingListRecord,
  type ShoppingListWithItemsRecord,
} from './repo';

import type {
  DishTag,
  GenerateResponseDto,
  MealType,
  MenuDto,
  MenuItemDto,
  MenuListItemDto,
  MenuViewDto,
  ShoppingListItemDto,
} from '@/contracts';
import type { FilledSlot } from '@/domain/generate';

const MENU_NOT_FOUND_MESSAGE = 'Menu not found';
const MENU_ITEM_NOT_FOUND_MESSAGE = 'Menu item not found';
const LOCKED_EXCEED_MESSAGE = 'Locked items exceed requested slots';

type GenerateMenuPayload = {
  name: string;
  totalSlots: Partial<Record<MealType, number>>;
  requiredDishes?: string[];
  requiredIngredients?: string[];
  filters?: {
    includeTags?: DishTag[];
  };
};

const buildDishMap = (dishes: DishWithIngredientsRecord[]) => {
  const map = new Map<string, DishWithIngredientsRecord>();
  dishes.forEach((dish) => {
    map.set(dish.id, dish);
  });
  return map;
};

type ShoppingListResponseBase = {
  id: string;
  status: ShoppingListRecord['status'];
  name: string;
  createdAt: string;
};

const toShoppingListResponse = (list: ShoppingListRecord): ShoppingListResponseBase => ({
  id: list.id,
  status: list.status,
  name: list.name,
  createdAt: list.createdAt,
});

const toShoppingListWithItemsResponse = (
  list: ShoppingListRecord,
  items: ShoppingListItemDto[],
): GenerateResponseDto['shoppingList'] => ({
  ...toShoppingListResponse(list),
  items,
});

const stripShoppingListItems = (list: ShoppingListWithItemsRecord): ShoppingListRecord => ({
  id: list.id,
  menuId: list.menuId,
  status: list.status,
  name: list.name,
  createdAt: list.createdAt,
});

const buildFridgeIndex = (items: FridgeItemRecord[]) => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    map.set(item.ingredientId, item.quantity);
  });
  return map;
};

const normalizeTotalSlots = (
  totalSlots: Partial<Record<MealType, number>>,
): Partial<Record<MealType, number>> => {
  const normalized: Partial<Record<MealType, number>> = {};
  (Object.entries(totalSlots) as [MealType, number | undefined][]).forEach(([mealType, count]) => {
    if (typeof count === 'number' && count > 0) {
      normalized[mealType] = count;
    }
  });
  return normalized;
};

const deriveShoppingListName = (menuName: string): string => {
  const trimmed = menuName.trim();
  if (!trimmed) {
    return 'shopping list';
  }
  return trimmed.toLowerCase().includes('shopping list') ? trimmed : `${trimmed} shopping list`;
};

type IngredientSummary = {
  name: string;
  unit: ShoppingListItemDto['unit'];
};

const buildIngredientSummaryIndex = (
  dishes: DishWithIngredientsRecord[],
  fridgeItems: FridgeItemRecord[],
): Map<string, IngredientSummary> => {
  const index = new Map<string, IngredientSummary>();
  dishes.forEach((dish) => {
    dish.ingredients.forEach((ingredient) => {
      if (!index.has(ingredient.ingredientId)) {
        index.set(ingredient.ingredientId, {
          name: ingredient.name,
          unit: ingredient.unit,
        });
      }
    });
  });
  fridgeItems.forEach((item) => {
    if (!index.has(item.ingredientId)) {
      index.set(item.ingredientId, {
        name: item.name,
        unit: item.unit,
      });
    }
  });
  return index;
};

const buildDishNameMap = (dishes: Map<string, DishWithIngredientsRecord>): Map<string, string> => {
  const map = new Map<string, string>();
  dishes.forEach((dish, id) => {
    map.set(id, dish.name);
  });
  return map;
};

const mapMenuItemsToDtos = (
  items: MenuItemRecord[],
  dishNames: Map<string, string>,
): MenuItemDto[] =>
  items.map((item) => ({
    id: item.id,
    menuId: item.menuId,
    mealType: item.mealType,
    dishName: dishNames.get(item.dishId) ?? 'Unknown dish',
    locked: item.locked,
    cooked: item.cooked,
  }));

const loadDishNames = async (dishIds: Iterable<string>): Promise<Map<string, string>> => {
  const uniqueIds = Array.from(new Set(Array.from(dishIds)));
  if (uniqueIds.length === 0) {
    return new Map();
  }
  return dishesRepository.getNamesByIds(DEFAULT_USER_ID, uniqueIds);
};

const toShoppingListItemDtos = (
  items: ShoppingListItemInsertData[],
  ingredientIndex: Map<string, IngredientSummary>,
): ShoppingListItemDto[] =>
  items.map((item) => {
    const summary = ingredientIndex.get(item.ingredientId);
    return {
      id: item.id,
      name: summary?.name ?? 'Unknown ingredient',
      quantity: item.quantity,
      unit: summary?.unit ?? item.unit,
      bought: item.bought,
    } satisfies ShoppingListItemDto;
  });

type SelectionContext = {
  totalSlots: Partial<Record<MealType, number>>;
  requiredDishes?: string[];
  requiredIngredients?: string[];
  includeTags?: DishTag[];
  dishes: DishWithIngredientsRecord[];
  fridgeItems: FridgeItemRecord[];
  excludedDishIds?: Set<string>;
};

const ensureRequiredDishCounts = (
  requiredIds: Set<string>,
  dishMap: Map<string, DishWithIngredientsRecord>,
  totalSlots: Partial<Record<MealType, number>>,
) => {
  const counts = new Map<MealType, number>();
  requiredIds.forEach((dishId) => {
    const dish = dishMap.get(dishId);
    if (!dish) {
      throw insufficientDishes('Required dish is not available');
    }
    const current = counts.get(dish.mealType) ?? 0;
    counts.set(dish.mealType, current + 1);
  });

  counts.forEach((count, mealType) => {
    const available = totalSlots[mealType] ?? 0;
    if (count > available) {
      throw insufficientDishes('Not enough slots for required dishes');
    }
  });
};

const filterDishes = (
  dishes: DishWithIngredientsRecord[],
  excludedDishIds: Set<string>,
): DishWithIngredientsRecord[] =>
  dishes.filter((dish) => dish.isActive && !excludedDishIds.has(dish.id));

const sanitizeRequiredDishes = (
  required: string[] | undefined,
  dishMap: Map<string, DishWithIngredientsRecord>,
  excludedDishIds: Set<string>,
): Set<string> => {
  const set = new Set<string>();
  (required ?? []).forEach((dishId) => {
    if (excludedDishIds.has(dishId)) {
      return;
    }
    const dish = dishMap.get(dishId);
    if (!dish || !dish.isActive) {
      throw insufficientDishes('Required dish is not available');
    }
    set.add(dishId);
  });
  return set;
};

const selectDishesForIngredients = (
  ingredientIds: string[],
  dishes: DishWithIngredientsRecord[],
  fridgeIndex: Map<string, number>,
  requiredSet: Set<string>,
  excludedDishIds: Set<string>,
) => {
  ingredientIds.forEach((ingredientId) => {
    const alreadySatisfied = Array.from(requiredSet).some((dishId) => {
      const dish = dishes.find((item) => item.id === dishId);
      return dish?.ingredients.some((entry) => entry.ingredientId === ingredientId);
    });
    if (alreadySatisfied) {
      return;
    }

    const candidates = dishes
      .filter(
        (dish) =>
          !excludedDishIds.has(dish.id) &&
          dish.isActive &&
          dish.ingredients.some((entry) => entry.ingredientId === ingredientId),
      )
      .map((dish) => ({ dish, score: scoreByFridgeOverlap(dish, fridgeIndex) }))
      .sort((a, b) => b.score - a.score || a.dish.name.localeCompare(b.dish.name));

    const candidate = candidates.find((entry) => !requiredSet.has(entry.dish.id));
    if (!candidate) {
      throw insufficientDishes('Unable to satisfy required ingredients');
    }
    requiredSet.add(candidate.dish.id);
  });
};

const ensureRequiredCoverage = (requiredIds: Set<string>, selected: FilledSlot[]) => {
  const selectedIds = new Set(selected.map((slot) => slot.dishId));
  for (const id of requiredIds) {
    if (!selectedIds.has(id)) {
      throw insufficientDishes('Failed to place required dishes');
    }
  }
};

const buildPool = (
  dishes: DishWithIngredientsRecord[],
  totalSlots: Partial<Record<MealType, number>>,
  includeTags: DishTag[] | undefined,
): Partial<Record<MealType, DishWithIngredientsRecord[]>> => {
  const pool: Partial<Record<MealType, DishWithIngredientsRecord[]>> = {};
  (Object.keys(totalSlots) as MealType[]).forEach((mealType) => {
    if ((totalSlots[mealType] ?? 0) <= 0) {
      return;
    }
    pool[mealType] = buildDishPool({
      dishes,
      mealType,
      tags: includeTags,
      isActiveOnly: false,
    });
  });
  return pool;
};

const selectDishes = (context: SelectionContext): FilledSlot[] => {
  const excluded = context.excludedDishIds ?? new Set<string>();
  const availableDishes = filterDishes(context.dishes, excluded);
  const dishMap = buildDishMap(availableDishes);
  const fridgeIndex = buildFridgeIndex(context.fridgeItems);

  const requiredSet = sanitizeRequiredDishes(context.requiredDishes, dishMap, excluded);

  if (context.requiredIngredients && context.requiredIngredients.length > 0) {
    selectDishesForIngredients(
      context.requiredIngredients,
      availableDishes,
      fridgeIndex,
      requiredSet,
      excluded,
    );
  }

  ensureRequiredDishCounts(requiredSet, dishMap, context.totalSlots);

  const pool = buildPool(availableDishes, context.totalSlots, context.includeTags);

  requiredSet.forEach((dishId) => {
    const dish = dishMap.get(dishId);
    if (!dish) {
      return;
    }
    const current = pool[dish.mealType] ?? [];
    if (!current.some((item) => item.id === dishId)) {
      pool[dish.mealType] = [...current, dish];
    }
  });

  const slots = fillSlots({
    totalSlots: context.totalSlots,
    requiredDishes: Array.from(requiredSet),
    pool,
    fridgeIndex,
  });

  ensureRequiredCoverage(requiredSet, slots);

  return slots;
};

const buildShoppingListItems = (
  shoppingListId: string,
  chosenItems: Array<Pick<MenuItemRecord, 'dishId'>>,
  dishes: Map<string, DishWithIngredientsRecord>,
  fridgeItems: FridgeItemRecord[],
): ShoppingListItemInsertData[] => {
  const dishIngredients: Record<string, DishWithIngredientsRecord['ingredients']> = {};
  dishes.forEach((dish) => {
    dishIngredients[dish.id] = dish.ingredients;
  });

  const shoppingListAggregation = calculateShoppingList({
    chosenDishes: chosenItems,
    dishIngredients,
    fridge: fridgeItems,
  });

  return shoppingListAggregation.map((entry) => ({
    id: createId(),
    shoppingListId,
    ingredientId: entry.ingredientId,
    quantity: entry.quantity,
    unit: entry.unit,
    bought: false,
  }));
};

export const menusService = {
  async list(): Promise<MenuListItemDto[]> {
    return menusRepository.list(DEFAULT_USER_ID);
  },

  async generate(payload: GenerateMenuPayload): Promise<GenerateResponseDto> {
    const totalSlots = normalizeTotalSlots(payload.totalSlots);

    const dishes = await dishesRepository.list(DEFAULT_USER_ID);
    const fridgeItems = await fridgeRepository.list(DEFAULT_USER_ID);
    const ingredientIndex = buildIngredientSummaryIndex(dishes, fridgeItems);
    const dishMap = buildDishMap(dishes);
    const slots = selectDishes({
      totalSlots,
      requiredDishes: payload.requiredDishes,
      requiredIngredients: payload.requiredIngredients,
      includeTags: payload.filters?.includeTags,
      dishes,
      fridgeItems,
    });

    const menuId = createId();
    const menuName = payload.name.trim();
    const shoppingListName = deriveShoppingListName(menuName);
    const menuItemInserts: MenuItemInsertData[] = slots.map((slot) => ({
      id: createId(),
      menuId,
      mealType: slot.mealType,
      dishId: slot.dishId,
      locked: false,
      cooked: false,
    }));

    const dishNameMap = buildDishNameMap(dishMap);

    const result = await db.transaction(async (tx) => {
      const menu = await menusRepository.insertMenu(tx, DEFAULT_USER_ID, {
        id: menuId,
        status: 'draft',
        name: menuName,
      });
      const storedItems = await menusRepository.insertMenuItems(tx, menuItemInserts);
      const shoppingListId = createId();
      const shoppingListItems = buildShoppingListItems(
        shoppingListId,
        storedItems,
        dishMap,
        fridgeItems,
      );
      const shoppingList = await menusRepository.insertShoppingList(tx, {
        id: shoppingListId,
        menuId,
        name: shoppingListName,
      });
      await menusRepository.replaceShoppingListItems(tx, shoppingListId, shoppingListItems);
      const shoppingListItemsDto = toShoppingListItemDtos(shoppingListItems, ingredientIndex);
      return {
        menu,
        items: storedItems,
        shoppingList,
        shoppingListItems: shoppingListItemsDto,
      };
    });

    return {
      menu: result.menu,
      items: mapMenuItemsToDtos(result.items, dishNameMap),
      shoppingList: toShoppingListWithItemsResponse(result.shoppingList, result.shoppingListItems),
    };
  },

  async get(id: string): Promise<MenuViewDto> {
    const menu = await menusRepository.findMenuView(DEFAULT_USER_ID, id);
    if (!menu) {
      throw notFound(MENU_NOT_FOUND_MESSAGE);
    }
    return menu;
  },

  async regenerate(id: string, payload: GenerateMenuPayload): Promise<GenerateResponseDto> {
    const aggregate = await menusRepository.findMenuWithDetails(DEFAULT_USER_ID, id);
    if (!aggregate || !aggregate.shoppingList) {
      throw notFound(MENU_NOT_FOUND_MESSAGE);
    }

    const {
      menu: existingMenu,
      items: existingItems,
      shoppingList: existingShoppingList,
    } = aggregate;

    const totalSlots = normalizeTotalSlots(payload.totalSlots);
    const dishes = await dishesRepository.list(DEFAULT_USER_ID);
    const fridgeItems = await fridgeRepository.list(DEFAULT_USER_ID);
    const ingredientIndex = buildIngredientSummaryIndex(dishes, fridgeItems);
    const dishMap = buildDishMap(dishes);
    const dishNameMap = buildDishNameMap(dishMap);

    const lockedItems = existingItems.filter((item) => item.locked);
    const unlockedItems = existingItems.filter((item) => !item.locked);
    const lockedDishIds = new Set(lockedItems.map((item) => item.dishId));

    const adjustedTotalSlots: Partial<Record<MealType, number>> = { ...totalSlots };
    lockedItems.forEach((item) => {
      const slotsForType = adjustedTotalSlots[item.mealType] ?? 0;
      if (slotsForType <= 0) {
        throw insufficientDishes(LOCKED_EXCEED_MESSAGE);
      }
      adjustedTotalSlots[item.mealType] = Math.max(slotsForType - 1, 0);
    });

    const satisfiedIngredients = new Set<string>();
    lockedItems.forEach((item) => {
      const dish = dishMap.get(item.dishId);
      dish?.ingredients.forEach((ingredient) => satisfiedIngredients.add(ingredient.ingredientId));
    });

    const pendingRequiredIngredients = payload.requiredIngredients?.filter(
      (ingredientId: string) => !satisfiedIngredients.has(ingredientId),
    );

    const slots = selectDishes({
      totalSlots: adjustedTotalSlots,
      requiredDishes: payload.requiredDishes?.filter(
        (dishId: string) => !lockedDishIds.has(dishId),
      ),
      requiredIngredients: pendingRequiredIngredients,
      includeTags: payload.filters?.includeTags,
      dishes,
      fridgeItems,
      excludedDishIds: lockedDishIds,
    });

    const newMenuItemInserts: MenuItemInsertData[] = slots.map((slot) => ({
      id: createId(),
      menuId: id,
      mealType: slot.mealType,
      dishId: slot.dishId,
      locked: false,
      cooked: false,
    }));
    const menuName = payload.name.trim();
    const shoppingListName = deriveShoppingListName(menuName);

    const result = await db.transaction(async (tx) => {
      if (unlockedItems.length > 0) {
        await menusRepository.deleteMenuItems(
          tx,
          id,
          unlockedItems.map((item) => item.id),
        );
      }
      const storedNewItems = await menusRepository.insertMenuItems(tx, newMenuItemInserts);
      const combinedItems = [...lockedItems, ...storedNewItems];
      const shoppingListId = existingShoppingList.id;
      const shoppingListItems = buildShoppingListItems(
        shoppingListId,
        combinedItems,
        dishMap,
        fridgeItems,
      );
      await menusRepository.replaceShoppingListItems(tx, shoppingListId, shoppingListItems);
      const shoppingListRecord =
        (await menusRepository.updateShoppingList(tx, shoppingListId, {
          name: shoppingListName,
        })) ?? stripShoppingListItems(existingShoppingList);
      const updatedMenuRecord =
        (await menusRepository.updateMenu(tx, DEFAULT_USER_ID, id, { name: menuName })) ??
        existingMenu;
      const shoppingListItemsDto = toShoppingListItemDtos(shoppingListItems, ingredientIndex);
      return {
        menu: updatedMenuRecord,
        items: [...lockedItems, ...storedNewItems],
        shoppingList: shoppingListRecord,
        shoppingListItems: shoppingListItemsDto,
      };
    });

    return {
      menu: result.menu,
      items: mapMenuItemsToDtos(result.items, dishNameMap),
      shoppingList: toShoppingListWithItemsResponse(result.shoppingList, result.shoppingListItems),
    };
  },

  async updateMenuItemCooked(
    menuId: string,
    itemId: string,
    cooked: boolean,
  ): Promise<MenuItemDto> {
    const menu = await menusRepository.findMenu(DEFAULT_USER_ID, menuId);
    if (!menu) {
      throw notFound(MENU_NOT_FOUND_MESSAGE);
    }
    const item = await menusRepository.updateMenuItem(db, menuId, itemId, { cooked });
    if (!item) {
      throw notFound(MENU_ITEM_NOT_FOUND_MESSAGE);
    }
    const dishNames = await loadDishNames([item.dishId]);
    return mapMenuItemsToDtos([item], dishNames)[0]!;
  },

  async lockMenuItems(menuId: string, itemIds: string[], locked: boolean): Promise<MenuItemDto[]> {
    const menu = await menusRepository.findMenu(DEFAULT_USER_ID, menuId);
    if (!menu) {
      throw notFound(MENU_NOT_FOUND_MESSAGE);
    }
    const items = await menusRepository.findMenuItems(menuId);
    const itemSet = new Set(items.map((item) => item.id));
    const invalid = itemIds.filter((id) => !itemSet.has(id));
    if (invalid.length > 0) {
      throw notFound(MENU_ITEM_NOT_FOUND_MESSAGE);
    }
    const updatedItems = await menusRepository.setMenuItemsLock(db, menuId, itemIds, locked);
    const dishNames = await loadDishNames(updatedItems.map((item) => item.dishId));
    return mapMenuItemsToDtos(updatedItems, dishNames);
  },

  async updateStatus(id: string, status: MenuDto['status']): Promise<MenuDto> {
    const menu = await menusRepository.findMenu(DEFAULT_USER_ID, id);
    if (!menu) {
      throw notFound(MENU_NOT_FOUND_MESSAGE);
    }
    if (menu.status === status) {
      throw invalidData('Menu already has this status', 409);
    }

    const updated = await db.transaction(async (tx) => {
      const [menuRow] = await tx
        .update(menus)
        .set({ status })
        .where(and(eq(menus.id, id), eq(menus.userId, DEFAULT_USER_ID)))
        .returning();

      if (!menuRow) {
        throw new Error('Failed to update menu status');
      }

      await tx.update(shoppingLists).set({ status }).where(eq(shoppingLists.menuId, id));

      return menuRow;
    });

    return {
      id: updated.id,
      status: updated.status,
      name: updated.name,
      createdAt: updated.createdAt.toISOString(),
    };
  },

  async delete(menuId: string): Promise<void> {
    const menu = await menusRepository.findMenu(DEFAULT_USER_ID, menuId);
    if (!menu) {
      throw notFound(MENU_NOT_FOUND_MESSAGE);
    }
    await db.transaction(async (tx) => menusRepository.deleteMenu(tx, DEFAULT_USER_ID, menuId));
  },
};
