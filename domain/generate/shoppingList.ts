import type {
  DishIngredientDto,
  FridgeItemDto,
  MenuItemDto,
  ShoppingListItemDto,
  Unit,
} from '@/contracts';

export type DishIngredientLookup = Record<string, DishIngredientDto[]>;

export type CalculateShoppingListArgs = {
  chosenDishes: Array<Pick<MenuItemDto, 'dishId'>>;
  dishIngredients: DishIngredientLookup;
  fridge: FridgeItemDto[];
  useFridge?: boolean;
};

export type ShoppingListAggregation = Array<
  Pick<ShoppingListItemDto, 'ingredientId' | 'quantity' | 'unit'>
>;

export const calculateShoppingList = ({
  chosenDishes,
  dishIngredients,
  fridge,
  useFridge = true,
}: CalculateShoppingListArgs): ShoppingListAggregation => {
  // Шаг 1: Собираем общее количество нужных ингредиентов из всех блюд
  const totals = new Map<string, { quantity: number; unit: Unit }>();

  for (const { dishId } of chosenDishes) {
    const ingredients = dishIngredients[dishId];
    if (!ingredients) continue;

    for (const ingredient of ingredients) {
      const existing = totals.get(ingredient.ingredientId);
      totals.set(ingredient.ingredientId, {
        quantity: (existing?.quantity ?? 0) + ingredient.qtyPerServing,
        unit: ingredient.unit,
      });
    }
  }

  if (!useFridge) {
    return Array.from(totals.entries()).map(([ingredientId, { quantity, unit }]) => ({
      ingredientId,
      quantity,
      unit,
    }));
  }

  // Шаг 2: Создаём индекс холодильника для быстрого поиска
  const fridgeMap = new Map(
    fridge.map((item) => [item.ingredientId, { quantity: item.quantity, unit: item.unit }]),
  );

  // Шаг 3: Вычисляем недостающие ингредиенты (вычитаем холодильник)
  return Array.from(totals.entries())
    .map(([ingredientId, { quantity, unit }]) => {
      const available = fridgeMap.get(ingredientId)?.quantity ?? 0;
      const needed = quantity - available;
      // Возвращаем только то, чего не хватает
      return needed > 0 ? { ingredientId, quantity: needed, unit } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};
