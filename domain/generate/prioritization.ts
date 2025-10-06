import type { DishWithIngredientsDto, MealType } from '@/contracts';

export type BuildDishPoolArgs = {
  mealType: MealType;
  tags?: string[];
  isActiveOnly?: boolean;
  dishes: DishWithIngredientsDto[];
};

export const buildDishPool = ({
  dishes,
  mealType,
  tags,
  isActiveOnly = true,
}: BuildDishPoolArgs): DishWithIngredientsDto[] => {
  const normalizedTags = tags?.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  const hasTagFilter = normalizedTags && normalizedTags.length > 0;

  return dishes.filter((dish) => {
    if (dish.mealType !== mealType) {
      return false;
    }

    if (isActiveOnly && !dish.isActive) {
      return false;
    }

    if (!hasTagFilter) {
      return true;
    }

    const dishTags = dish.tags.map((tag) => tag.toLowerCase());
    return normalizedTags.some((tag) => dishTags.includes(tag));
  });
};

export type FridgeIndex = ReadonlyMap<string, number>;

export const scoreByFridgeOverlap = (
  dish: DishWithIngredientsDto,
  fridgeIndex: FridgeIndex,
): number => {
  return dish.ingredients.reduce((score, ingredient) => {
    const fridgeQuantity = fridgeIndex.get(ingredient.ingredientId) ?? 0;
    if (fridgeQuantity <= 0) {
      return score;
    }
    const overlap = Math.min(fridgeQuantity, ingredient.quantity);
    return score + overlap;
  }, 0);
};

export type FillSlotsArgs = {
  totalSlots: Partial<Record<MealType, number>>;
  requiredDishes?: string[];
  pool: Partial<Record<MealType, DishWithIngredientsDto[]>>;
  fridgeIndex: FridgeIndex;
};

export type FilledSlot = {
  mealType: MealType;
  dishId: string;
};

export const fillSlots = ({
  totalSlots,
  requiredDishes,
  pool,
  fridgeIndex,
}: FillSlotsArgs): FilledSlot[] => {
  const results: FilledSlot[] = [];
  const usedDishIds = new Set<string>();

  const remainingSlots = new Map<MealType, number>();
  (Object.entries(totalSlots) as [MealType, number | undefined][]).forEach(([mealType, count]) => {
    if (typeof count === 'number' && count > 0) {
      remainingSlots.set(mealType, count);
    }
  });

  if (remainingSlots.size === 0) {
    return results;
  }

  const poolByMealType = new Map<MealType, DishWithIngredientsDto[]>();
  Object.entries(pool).forEach(([mealType, dishesForType]) => {
    if (!dishesForType || dishesForType.length === 0) {
      return;
    }
    poolByMealType.set(mealType as MealType, [...dishesForType]);
  });

  const dishIndex = new Map<string, DishWithIngredientsDto>();
  for (const dishesForType of poolByMealType.values()) {
    dishesForType.forEach((dish) => {
      dishIndex.set(dish.id, dish);
    });
  }

  if (requiredDishes && requiredDishes.length > 0) {
    requiredDishes.forEach((dishId) => {
      const dish = dishIndex.get(dishId);
      if (!dish) {
        return;
      }
      const remaining = remainingSlots.get(dish.mealType) ?? 0;
      if (remaining <= 0) {
        return;
      }
      results.push({ mealType: dish.mealType, dishId });
      usedDishIds.add(dishId);
      remainingSlots.set(dish.mealType, remaining - 1);
    });
  }

  const scoredPool = new Map<MealType, { dish: DishWithIngredientsDto; score: number }[]>();
  poolByMealType.forEach((dishesForType, mealType) => {
    const scored = dishesForType.map((dish) => ({
      dish,
      score: scoreByFridgeOverlap(dish, fridgeIndex),
    }));
    scored.sort((a, b) => b.score - a.score || a.dish.name.localeCompare(b.dish.name));
    scoredPool.set(mealType, scored);
  });

  remainingSlots.forEach((count, mealType) => {
    if (count <= 0) {
      return;
    }

    const candidates = scoredPool.get(mealType) ?? [];
    if (candidates.length === 0) {
      return;
    }

    let filled = 0;
    for (const candidate of candidates) {
      if (filled >= count) {
        break;
      }
      if (usedDishIds.has(candidate.dish.id)) {
        continue;
      }
      results.push({ mealType, dishId: candidate.dish.id });
      usedDishIds.add(candidate.dish.id);
      filled += 1;
    }
  });

  return results;
};
