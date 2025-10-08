import type { DishTag, DishWithIngredientsDto, MealType } from '@/contracts';

// ============================================================================
// buildDishPool - фильтрация блюд по критериям
// ============================================================================

export type BuildDishPoolArgs = {
  mealType: MealType;
  tags?: DishTag[];
  isActiveOnly?: boolean;
  dishes: DishWithIngredientsDto[];
};

export const buildDishPool = ({
  dishes,
  mealType,
  tags,
  isActiveOnly = true,
}: BuildDishPoolArgs): DishWithIngredientsDto[] => {
  // Создаём Set тегов только если теги переданы
  const tagSet = tags && tags.length > 0 ? new Set(tags) : null;

  return dishes.filter((dish) => {
    // Проверяем тип приёма пищи
    if (dish.mealType !== mealType) return false;

    // Проверяем активность блюда
    if (isActiveOnly && !dish.isActive) return false;

    // Если тегов нет - блюдо подходит
    if (!tagSet) return true;

    // Проверяем, есть ли хотя бы один совпадающий тег
    return dish.tags.some((tag) => tagSet.has(tag));
  });
};

// ============================================================================
// Скоринг блюд по наличию ингредиентов в холодильнике
// ============================================================================

export type FridgeIndex = ReadonlyMap<string, number>;

export const scoreByFridgeOverlap = (
  dish: DishWithIngredientsDto,
  fridgeIndex: FridgeIndex,
): number => {
  return dish.ingredients.reduce((score, ingredient) => {
    const fridgeQuantity = fridgeIndex.get(ingredient.ingredientId) ?? 0;
    if (fridgeQuantity <= 0) return score;

    // Считаем overlap (пересечение) между нужным и доступным количеством
    const overlap = Math.min(fridgeQuantity, ingredient.qtyPerServing);
    return score + overlap;
  }, 0);
};

// ============================================================================
// Вспомогательная функция: перемешивание массива (Fisher-Yates shuffle)
// ============================================================================

const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    //@ts-expect-error its ok
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// ============================================================================
// Заполнение слотов меню блюдами
// ============================================================================

export type FillSlotsArgs = {
  totalSlots: Partial<Record<MealType, number>>;
  requiredDishes?: string[];
  pool: Partial<Record<MealType, DishWithIngredientsDto[]>>;
  fridgeIndex: FridgeIndex;
  useFridge?: boolean;
};

export type FilledSlot = {
  mealType: MealType;
  dishId: string;
};

export const fillSlots = ({
  totalSlots,
  requiredDishes = [],
  pool,
  fridgeIndex,
  useFridge = true,
}: FillSlotsArgs): FilledSlot[] => {
  const results: FilledSlot[] = [];
  const usedDishIds = new Set<string>();

  // Создаём индекс всех блюд из пула для быстрого поиска по ID
  const dishIndex = new Map<string, DishWithIngredientsDto>();
  for (const dishes of Object.values(pool)) {
    dishes?.forEach((dish) => dishIndex.set(dish.id, dish));
  }

  // Создаём счётчик оставшихся слотов для каждого mealType
  const remainingSlots = new Map(
    Object.entries(totalSlots)
      //unused var _ is ok
      //eslint-disable-next-line
      .filter(([_, count]) => typeof count === 'number' && count > 0)
      .map(([mealType, count]) => [mealType as MealType, count]),
  );

  if (remainingSlots.size === 0) return [];

  // Шаг 1: Добавляем обязательные блюда (всегда выполняется)
  for (const dishId of requiredDishes) {
    const dish = dishIndex.get(dishId);
    if (!dish) continue;

    const remaining = remainingSlots.get(dish.mealType) ?? 0;
    if (remaining <= 0) continue;

    results.push({ mealType: dish.mealType, dishId });
    usedDishIds.add(dishId);
    remainingSlots.set(dish.mealType, remaining - 1);
  }

  // Шаг 2: Подготавливаем пул блюд для каждого mealType
  const preparedPool = new Map<MealType, DishWithIngredientsDto[]>();

  for (const [mealType, dishes] of Object.entries(pool)) {
    if (!dishes || dishes.length === 0) continue;

    let prepared: DishWithIngredientsDto[];

    if (useFridge) {
      prepared = [...dishes]
        .map((dish) => ({ dish, score: scoreByFridgeOverlap(dish, fridgeIndex) }))
        .sort((a, b) => b.score - a.score || a.dish.name.localeCompare(b.dish.name))
        .map(({ dish }) => dish);
    } else {
      prepared = shuffleArray(dishes);
    }

    preparedPool.set(mealType as MealType, prepared);
  }

  // Шаг 3: Заполняем оставшиеся слоты
  for (const [mealType, slotsNeeded] of remainingSlots) {
    if (slotsNeeded <= 0) continue;

    const candidates = preparedPool.get(mealType) ?? [];
    let filled = 0;

    for (const dish of candidates) {
      if (filled >= slotsNeeded) break;
      if (usedDishIds.has(dish.id)) continue;

      results.push({ mealType, dishId: dish.id });
      usedDishIds.add(dish.id);
      filled++;
    }
  }

  return results;
};
