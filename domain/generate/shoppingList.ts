import type {
  DishIngredientRefDto,
  FridgeItemDto,
  MenuItemDto,
  ShoppingListItemDto,
  Unit,
} from '@/contracts';

export type DishIngredientLookup = Record<string, DishIngredientRefDto[]>;

export type CalculateShoppingListArgs = {
  chosenDishes: Array<Pick<MenuItemDto, 'dishId'>>;
  dishIngredients: DishIngredientLookup;
  fridge: FridgeItemDto[];
};

export type ShoppingListAggregation = Array<
  Pick<ShoppingListItemDto, 'ingredientId' | 'quantity' | 'unit'>
>;

const unitFallback = (
  unitFromDish: Unit | undefined,
  unitFromFridge: Unit | undefined,
): Unit | undefined => {
  if (unitFromDish) {
    return unitFromDish;
  }
  return unitFromFridge;
};

export const calculateShoppingList = ({
  chosenDishes,
  dishIngredients,
  fridge,
}: CalculateShoppingListArgs): ShoppingListAggregation => {
  const totals = new Map<string, { quantity: number; unit?: Unit }>();

  chosenDishes.forEach(({ dishId }) => {
    const ingredients = dishIngredients[dishId];
    if (!ingredients) {
      return;
    }

    ingredients.forEach((ingredient) => {
      const existing = totals.get(ingredient.ingredientId);
      const nextQuantity = (existing?.quantity ?? 0) + ingredient.quantity;
      const nextUnit = unitFallback(ingredient.unit, existing?.unit);
      totals.set(ingredient.ingredientId, { quantity: nextQuantity, unit: nextUnit });
    });
  });

  if (totals.size === 0) {
    return [];
  }

  const fridgeIndex = new Map<string, { quantity: number; unit: Unit }>();
  fridge.forEach((item) => {
    fridgeIndex.set(item.ingredientId, { quantity: item.quantity, unit: item.unit });
  });

  const result: ShoppingListAggregation = [];
  totals.forEach((value, ingredientId) => {
    const fridgeEntry = fridgeIndex.get(ingredientId);
    const available = fridgeEntry?.quantity ?? 0;
    const needed = value.quantity - available;
    if (needed <= 0) {
      return;
    }
    const unit = unitFallback(value.unit, fridgeEntry?.unit);
    if (!unit) {
      return;
    }
    result.push({ ingredientId, quantity: needed, unit });
  });

  return result;
};
