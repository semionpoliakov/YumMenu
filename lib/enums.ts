import {
  DishTagEnum,
  MealTypeEnum,
  StatusEnum,
  UnitEnum,
  type DishTag as DomainDishTag,
  type MealTypeValue,
  type StatusValue,
  type UnitValue,
} from '@/domain/common/enums';

export const mealTypeOptions = MealTypeEnum.map((value) => ({
  label: value.charAt(0).toUpperCase() + value.slice(1),
  value,
}));

export const unitOptions = UnitEnum.map((value) => ({
  label: value.toUpperCase(),
  value,
}));

export const dishTagOptions = DishTagEnum.map((value) => ({
  label: value.charAt(0).toUpperCase() + value.slice(1),
  value,
}));

export const statusOptions = StatusEnum.map((value) => ({
  label: value.charAt(0).toUpperCase() + value.slice(1),
  value,
}));

export type MealTypeOption = (typeof mealTypeOptions)[number];
export type UnitOption = (typeof unitOptions)[number];
export type DishTagOption = (typeof dishTagOptions)[number];
export type StatusOption = (typeof statusOptions)[number];

export type MealType = MealTypeValue;
export type Unit = UnitValue;
export type DishTag = DomainDishTag;
export type Status = StatusValue;
