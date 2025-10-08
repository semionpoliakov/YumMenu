import { db } from '@/db/client';
import { calculateShoppingList, fillSlots } from '@/domain/generate';
import { buildDishPool, scoreByFridgeOverlap } from '@/domain/generate/prioritization';
import { DEFAULT_USER_ID } from '@/domain/users/constants';
import { insufficientDishes, notFound } from '@/lib/errors';
import { createId } from '@/lib/ids';

import { dishesRepository } from '../dishes/repo';
import { fridgeRepository } from '../fridge/repo';

import { menusRepository, type MenuItemInsertData, type ShoppingListItemInsertData } from './repo';

import type {
  DishTag,
  DishWithIngredientsDto,
  FridgeItemDto,
  GenerateResponseDto,
  MealType,
  MenuItemDto,
  MenuListItemDto,
  MenuViewDto,
  ShoppingListDto,
  ShoppingListWithItemsDto,
} from '@/contracts';
import type { FilledSlot } from '@/domain/generate';

const MENU_NOT_FOUND_MESSAGE = 'Menu not found';
const MENU_ITEM_NOT_FOUND_MESSAGE = 'Menu item not found';
const LOCKED_EXCEED_MESSAGE = 'Locked items exceed requested slots';

type GenerateMenuPayload = {
  name: string;
  perDay: Partial<Record<MealType, number>>;
  requiredDishes?: string[];
  requiredIngredients?: string[];
  filters?: {
    includeCategories?: string[];
    includeTags?: DishTag[];
  };
};

const buildDishMap = (dishes: DishWithIngredientsDto[]) => {
  const map = new Map<string, DishWithIngredientsDto>();
  dishes.forEach((dish) => {
    map.set(dish.id, dish);
  });
  return map;
};

const toShoppingListBase = (list: ShoppingListDto | ShoppingListWithItemsDto): ShoppingListDto => ({
  id: list.id,
  menuId: list.menuId,
  status: list.status,
  name: list.name,
  createdAt: list.createdAt,
});

const buildFridgeIndex = (items: FridgeItemDto[]) => {
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

type SelectionContext = {
  totalSlots: Partial<Record<MealType, number>>;
  requiredDishes?: string[];
  requiredIngredients?: string[];
  includeTags?: DishTag[];
  dishes: DishWithIngredientsDto[];
  fridgeItems: FridgeItemDto[];
  excludedDishIds?: Set<string>;
};

const ensureRequiredDishCounts = (
  requiredIds: Set<string>,
  dishMap: Map<string, DishWithIngredientsDto>,
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
  dishes: DishWithIngredientsDto[],
  excludedDishIds: Set<string>,
): DishWithIngredientsDto[] =>
  dishes.filter((dish) => dish.isActive && !excludedDishIds.has(dish.id));

const sanitizeRequiredDishes = (
  required: string[] | undefined,
  dishMap: Map<string, DishWithIngredientsDto>,
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
  dishes: DishWithIngredientsDto[],
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
  dishes: DishWithIngredientsDto[],
  totalSlots: Partial<Record<MealType, number>>,
  includeTags: DishTag[] | undefined,
): Partial<Record<MealType, DishWithIngredientsDto[]>> => {
  const pool: Partial<Record<MealType, DishWithIngredientsDto[]>> = {};
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
  chosenItems: Array<Pick<MenuItemDto, 'dishId'>>,
  dishes: Map<string, DishWithIngredientsDto>,
  fridgeItems: FridgeItemDto[],
): ShoppingListItemInsertData[] => {
  const dishIngredients: Record<string, DishWithIngredientsDto['ingredients']> = {};
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
    const totalSlots = normalizeTotalSlots(payload.perDay);

    const dishes = await dishesRepository.list(DEFAULT_USER_ID);
    const fridgeItems = await fridgeRepository.list(DEFAULT_USER_ID);
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
    const menuItemInserts: MenuItemInsertData[] = slots.map((slot) => ({
      id: createId(),
      menuId,
      mealType: slot.mealType,
      dishId: slot.dishId,
      locked: false,
      cooked: false,
    }));
    const shoppingListName = deriveShoppingListName(payload.name);

    const result = await db.transaction(async (tx) => {
      const menu = await menusRepository.insertMenu(tx, DEFAULT_USER_ID, {
        id: menuId,
        status: 'draft',
        name: payload.name,
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
      const shoppingListWithItems: ShoppingListWithItemsDto = {
        ...shoppingList,
        items: shoppingListItems.map((item) => ({ ...item })),
      };
      return {
        menu,
        items: storedItems,
        shoppingList: shoppingListWithItems,
      } satisfies GenerateResponseDto;
    });

    return result;
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

    const totalSlots = normalizeTotalSlots(payload.perDay);
    const dishes = await dishesRepository.list(DEFAULT_USER_ID);
    const fridgeItems = await fridgeRepository.list(DEFAULT_USER_ID);
    const dishMap = buildDishMap(dishes);

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
    const shoppingListName = deriveShoppingListName(payload.name);

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
        (await menusRepository.updateShoppingList(tx, shoppingListId, { name: shoppingListName })) ??
        existingShoppingList;
      const shoppingListBase = toShoppingListBase(shoppingListRecord);
      const updatedMenuRecord =
        (await menusRepository.updateMenu(tx, DEFAULT_USER_ID, id, { name: payload.name })) ??
        existingMenu;
      const shoppingListWithItems: ShoppingListWithItemsDto = {
        ...shoppingListBase,
        items: shoppingListItems.map((item) => ({ ...item })),
      };
      return {
        menu: updatedMenuRecord,
        items: [...lockedItems, ...storedNewItems],
        shoppingList: shoppingListWithItems,
      } satisfies GenerateResponseDto;
    });

    return result;
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
    return item;
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
    return menusRepository.setMenuItemsLock(db, menuId, itemIds, locked);
  },

  async delete(menuId: string): Promise<void> {
    const menu = await menusRepository.findMenu(DEFAULT_USER_ID, menuId);
    if (!menu) {
      throw notFound(MENU_NOT_FOUND_MESSAGE);
    }
    await db.transaction(async (tx) => menusRepository.deleteMenu(tx, DEFAULT_USER_ID, menuId));
  },
};
