'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFieldArray, type FieldError } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DishTag as DishTagSchema,
  MealType as MealTypeSchema,
  type DishCreateInput,
  type DishUpdateInput,
  type DishWithIngredientsDto,
  type IngredientDto,
} from '@/contracts';
import { useCreateDish, useUpdateDish } from '@/data-access/hooks';
import { dishTagOptions, mealTypeOptions } from '@/lib/enums';
import { nonEmptyString, stringToNumber, useZodForm } from '@/lib/forms';

import { DishIngredientsEditor } from './DishIngredientsEditor';

import type { DishFormValues } from './types';

const ingredientEntrySchema = z.object({
  ingredientId: z.string().min(1, 'Select ingredient'),
  qtyPerServing: z.string().refine((value) => {
    const parsed = stringToNumber(value);
    return parsed !== undefined && parsed > 0;
  }, 'Enter quantity > 0'),
});

const dishSchema = z.object({
  name: nonEmptyString,
  description: z.string().max(2000).default(''),
  mealType: MealTypeSchema,
  tags: z.array(DishTagSchema).default([]),
  isActive: z.boolean().default(true),
  ingredients: z.array(ingredientEntrySchema).min(1, 'Add at least one ingredient'),
});

type DishFormDialogProps = {
  trigger: ReactNode;
  ingredients: IngredientDto[];
  dish?: DishWithIngredientsDto;
};

export function DishFormDialog({ trigger, ingredients, dish }: DishFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(dish);

  const defaultIngredients = useMemo(() => {
    if (dish) {
      return dish.ingredients.map((item) => {
        const ingredientMatch = ingredients.find((ingredient) => ingredient.name === item.name);
        return {
          ingredientId: ingredientMatch?.id ?? '',
          qtyPerServing: String(item.qtyPerServing),
        };
      });
    }

    const firstIngredient = ingredients[0];
    if (firstIngredient) {
      return [
        {
          ingredientId: firstIngredient.id,
          qtyPerServing: '1',
        },
      ];
    }

    return [];
  }, [dish, ingredients]);

  const form = useZodForm(dishSchema, {
    defaultValues: {
      name: dish?.name ?? '',
      description: dish?.description ?? '',
      mealType: dish?.mealType ?? mealTypeOptions[0]?.value ?? 'breakfast',
      tags: dish?.tags ?? [],
      isActive: dish?.isActive ?? true,
      ingredients: defaultIngredients,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: dish?.name ?? '',
        description: dish?.description ?? '',
        mealType: dish?.mealType ?? mealTypeOptions[0]?.value ?? 'breakfast',
        tags: dish?.tags ?? [],
        isActive: dish?.isActive ?? true,
        ingredients: defaultIngredients,
      });
    }
  }, [dish, defaultIngredients, form, open]);

  const { fields, append, remove } = useFieldArray<DishFormValues>({
    control: form.control,
    name: 'ingredients',
  });

  const createMutation = useCreateDish();
  const updateMutation = useUpdateDish();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: z.infer<typeof dishSchema>) => {
    const payloadBase: DishCreateInput = {
      name: values.name,
      description: values.description,
      mealType: values.mealType,
      tags: values.tags,
      isActive: values.isActive,
      ingredients: values.ingredients.map((item) => {
        const quantity = stringToNumber(item.qtyPerServing);
        if (quantity === undefined || quantity <= 0) {
          throw new Error('Invalid quantity');
        }
        return {
          ingredientId: item.ingredientId,
          qtyPerServing: quantity,
        };
      }),
    };

    if (isEdit && dish) {
      const payload: DishUpdateInput = {
        name: payloadBase.name,
        description: payloadBase.description,
        mealType: payloadBase.mealType,
        tags: payloadBase.tags,
        isActive: payloadBase.isActive,
        ingredients: payloadBase.ingredients,
      };
      await updateMutation.mutateAsync({ id: dish.id, input: payload });
    } else {
      await createMutation.mutateAsync(payloadBase);
    }

    setOpen(false);
  };

  const handleAddIngredient = () => {
    const firstIngredient = ingredients[0];
    if (!firstIngredient) return;
    append({ ingredientId: firstIngredient.id, qtyPerServing: '1' });
  };

  const toggleTag = (tagValue: z.infer<typeof DishTagSchema>) => {
    const existing = form.getValues('tags');
    if (existing.includes(tagValue)) {
      form.setValue(
        'tags',
        existing.filter((tag) => tag !== tagValue),
      );
    } else {
      form.setValue('tags', [...existing, tagValue]);
    }
  };

  const currentTags = form.watch('tags');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset({
        name: dish?.name ?? '',
        description: dish?.description ?? '',
        mealType: dish?.mealType ?? mealTypeOptions[0]?.value ?? 'breakfast',
        tags: dish?.tags ?? [],
        isActive: dish?.isActive ?? true,
        ingredients: defaultIngredients,
      });
    }
    setOpen(nextOpen);
  };

  const ingredientError = form.formState.errors.ingredients as
    | FieldError
    | FieldError[]
    | undefined;
  const ingredientMessage = Array.isArray(ingredientError)
    ? ingredientError[0]?.message
    : ingredientError?.message;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Dish' : 'New Dish'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(event) => {
              void form.handleSubmit(handleSubmit)(event);
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Spicy soup" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Short notes about the dish" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mealType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {mealTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap gap-2">
                {dishTagOptions.map((option) => {
                  const active = currentTags.includes(option.value);
                  return (
                    <Button
                      type="button"
                      key={option.value}
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTag(option.value)}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border border-border p-2">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DishIngredientsEditor
              control={form.control}
              fields={fields}
              ingredientOptions={ingredients}
              onAdd={handleAddIngredient}
              onRemove={remove}
            />
            {ingredientMessage ? (
              <p className="text-xs font-medium text-destructive">{ingredientMessage}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || ingredients.length === 0}>
                {ingredients.length === 0
                  ? 'Add ingredients first'
                  : isSubmitting
                    ? 'Saving...'
                    : 'Save'}
              </Button>
            </DialogFooter>
            {ingredients.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add ingredients to your library before creating dishes.
              </p>
            ) : null}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
