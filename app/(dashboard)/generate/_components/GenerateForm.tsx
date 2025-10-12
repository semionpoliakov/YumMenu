'use client';

import { useMemo } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DishTag as DishTagSchema, MealType as MealTypeSchema } from '@/contracts';
import { useGenerateMenu } from '@/data-access/hooks';
import { dishTagOptions, mealTypeOptions } from '@/lib/enums';
import { nonEmptyString, stringToNumber, useZodForm } from '@/lib/forms';

import type {
  DishWithIngredientsDto,
  GenerateRequestInput,
  GenerateResponseDto,
  IngredientDto,
} from '@/contracts';

const slotValueSchema = z
  .string()
  .default('0')
  .refine((value) => {
    if (value === '') return true;
    const parsed = stringToNumber(value);
    return parsed !== undefined && parsed >= 0;
  }, 'Enter a non-negative number');

const slotsSchema = z.object({
  breakfast: slotValueSchema,
  lunch: slotValueSchema,
  dinner: slotValueSchema,
  snack: slotValueSchema,
  dessert: slotValueSchema,
});

const generateSchema = z
  .object({
    name: nonEmptyString,
    slots: slotsSchema,
    includeTags: z.array(DishTagSchema).default([]),
    requiredDishes: z.array(z.string()).default([]),
    requiredIngredients: z.array(z.string()).default([]),
  })
  .superRefine((value, ctx) => {
    const total = Object.values(value.slots).reduce((sum, current) => {
      const parsed = stringToNumber(current) ?? 0;
      return sum + parsed;
    }, 0);
    if (total <= 0) {
      ctx.addIssue({
        path: ['slots'],
        code: z.ZodIssueCode.custom,
        message: 'Add at least one meal slot',
      });
    }
  });

type GenerateFormValues = z.infer<typeof generateSchema>;
type MealTypeValue = z.infer<typeof MealTypeSchema>;
type SlotFieldName = `slots.${MealTypeValue}`;

type GenerateFormProps = {
  dishes: DishWithIngredientsDto[];
  ingredients: IngredientDto[];
  onSuccess: (result: GenerateResponseDto, payload: GenerateRequestInput) => void;
};

const defaultSlots: GenerateFormValues['slots'] = {
  breakfast: '0',
  lunch: '0',
  dinner: '0',
  snack: '0',
  dessert: '0',
};

export function GenerateForm({ dishes, ingredients, onSuccess }: GenerateFormProps) {
  const generateMutation = useGenerateMenu();
  const form = useZodForm(generateSchema, {
    defaultValues: {
      name: 'Weekly Menu',
      slots: { ...defaultSlots, dinner: '2', lunch: '2' },
      includeTags: [],
      requiredDishes: [],
      requiredIngredients: [],
    },
  });

  const dishOptions = useMemo(
    () =>
      dishes.map((dish) => ({
        label: dish.name,
        value: dish.id,
      })),
    [dishes],
  );

  const ingredientOptions = useMemo(
    () =>
      ingredients.map((ingredient) => ({
        label: ingredient.name,
        value: ingredient.id,
      })),
    [ingredients],
  );

  const includeTags = form.watch('includeTags');
  const slotsErrorMessage = (form.formState.errors.slots as { message?: string } | undefined)
    ?.message;

  const onSubmit = async (values: GenerateFormValues) => {
    const totalSlots = mealTypeOptions.reduce<GenerateRequestInput['totalSlots']>((acc, option) => {
      const raw = values.slots[option.value];
      const parsed = stringToNumber(raw ?? '');
      if (parsed && parsed > 0) {
        acc[option.value] = parsed;
      }
      return acc;
    }, {});

    const payload: GenerateRequestInput = {
      name: values.name,
      totalSlots,
    };

    if (values.includeTags.length > 0) {
      payload.filters = { includeTags: values.includeTags };
    }
    if (values.requiredDishes.length > 0) {
      payload.requiredDishes = values.requiredDishes;
    }
    if (values.requiredIngredients.length > 0) {
      payload.requiredIngredients = values.requiredIngredients;
    }

    const result = await generateMutation.mutateAsync(payload);
    onSuccess(result, payload);
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <Form {...form}>
          <form
            onSubmit={(event) => {
              void form.handleSubmit(onSubmit)(event);
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Weekly plan" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Meals per day</FormLabel>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {mealTypeOptions.map((option) => {
                  const fieldName: SlotFieldName = `slots.${option.value}`;
                  return (
                    <FormField
                      key={option.value}
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            {option.label}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="1"
                              value={field.value ?? '0'}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
              {slotsErrorMessage ? (
                <p className="text-xs font-medium text-destructive">{slotsErrorMessage}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <FormLabel>Include tags</FormLabel>
              <div className="flex flex-wrap gap-2">
                {dishTagOptions.map((option) => {
                  const active = includeTags.includes(option.value);
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const current = form.getValues('includeTags');
                        if (active) {
                          form.setValue(
                            'includeTags',
                            current.filter((tag) => tag !== option.value),
                          );
                        } else {
                          form.setValue('includeTags', [...current, option.value]);
                        }
                      }}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <FormLabel>Required dishes</FormLabel>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                {dishOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No dishes available.</p>
                ) : (
                  dishOptions.map((dish) => (
                    <FormField
                      key={dish.value}
                      control={form.control}
                      name="requiredDishes"
                      render={({ field }) => {
                        const checked = field.value?.includes(dish.value) ?? false;
                        return (
                          <FormItem className="flex flex-row items-center justify-between space-y-0">
                            <FormLabel className="text-sm font-normal">{dish.label}</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) => {
                                  if (next) {
                                    field.onChange([...(field.value ?? []), dish.value]);
                                  } else {
                                    field.onChange(
                                      field.value?.filter((value) => value !== dish.value) ?? [],
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        );
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <FormLabel>Required ingredients</FormLabel>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                {ingredientOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No ingredients available.</p>
                ) : (
                  ingredientOptions.map((ingredient) => (
                    <FormField
                      key={ingredient.value}
                      control={form.control}
                      name="requiredIngredients"
                      render={({ field }) => {
                        const checked = field.value?.includes(ingredient.value) ?? false;
                        return (
                          <FormItem className="flex flex-row items-center justify-between space-y-0">
                            <FormLabel className="text-sm font-normal">
                              {ingredient.label}
                            </FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) => {
                                  if (next) {
                                    field.onChange([...(field.value ?? []), ingredient.value]);
                                  } else {
                                    field.onChange(
                                      field.value?.filter((value) => value !== ingredient.value) ??
                                        [],
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        );
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? 'Generating...' : 'Generate menu'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
