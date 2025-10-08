export const UnitEnum = ['pcs', 'g', 'ml'] as const;
export type UnitValue = (typeof UnitEnum)[number];

export const MealTypeEnum = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const;
export type MealTypeValue = (typeof MealTypeEnum)[number];

export const StatusEnum = ['draft', 'final'] as const;
export type StatusValue = (typeof StatusEnum)[number];

export const DishTagEnum = [
  'salad',
  'chicken',
  'meat',
  'fish',
  'soup',
  'dessert',
  'spicy',
  'sweet',
  'salty',
  'dairy',
] as const;
export type DishTag = (typeof DishTagEnum)[number];

export const isUnit = (value: unknown): value is UnitValue =>
  typeof value === 'string' && (UnitEnum as readonly string[]).includes(value);

export const isMealType = (value: unknown): value is MealTypeValue =>
  typeof value === 'string' && (MealTypeEnum as readonly string[]).includes(value);

export const isStatus = (value: unknown): value is StatusValue =>
  typeof value === 'string' && (StatusEnum as readonly string[]).includes(value);

export const isDishTag = (value: unknown): value is DishTag =>
  typeof value === 'string' && (DishTagEnum as readonly string[]).includes(value);
