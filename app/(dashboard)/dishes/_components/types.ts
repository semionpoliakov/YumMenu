import type { DishTag, MealType } from '@/lib/enums';

export type DishIngredientFormValue = {
  ingredientId: string;
  qtyPerServing: string;
};

export type DishFormValues = {
  name: string;
  description: string;
  mealType: MealType;
  tags: DishTag[];
  isActive: boolean;
  ingredients: DishIngredientFormValue[];
};
