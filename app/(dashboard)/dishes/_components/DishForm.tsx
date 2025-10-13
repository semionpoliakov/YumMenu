'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useFieldArray, type FieldError } from 'react-hook-form';
import { z } from 'zod';

import { FormActions } from '@/components/FormActions';
import { Button } from '@/components/ui/button';
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
import { stringToNumber, useZodForm } from '@/lib/forms';

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
  name: z.string().trim().min(1, 'Required'),
  description: z.string().max(2000).default(''),
  mealType: MealTypeSchema,
  tags: z.array(DishTagSchema).default([]),
  isActive: z.boolean().default(true),
  ingredients: z.array(ingredientEntrySchema).min(1, 'Add at least one ingredient'),
});

type DishFormProps = {
  ingredients: IngredientDto[];
  dish?: DishWithIngredientsDto;
  onSuccess?: () => void;
};

export function DishForm({ ingredients, dish, onSuccess }: DishFormProps) {
  const router = useRouter();
  const isEdit = Boolean(dish);

  const defaultIngredients = useMemo(() => {
    if (!dish) return [];

    return dish.ingredients.map((item) => {
      const match = ingredients.find((ingredient) => ingredient.name === item.name);
      return {
        ingredientId: match?.id ?? '',
        qtyPerServing: String(item.qtyPerServing),
      };
    });
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
    form.reset({
      name: dish?.name ?? '',
      description: dish?.description ?? '',
      mealType: dish?.mealType ?? mealTypeOptions[0]?.value ?? 'breakfast',
      tags: dish?.tags ?? [],
      isActive: dish?.isActive ?? true,
      ingredients: defaultIngredients,
    });
  }, [dish, defaultIngredients, form]);

  const { fields, append, remove } = useFieldArray<DishFormValues>({
    control: form.control,
    name: 'ingredients',
  });

  const createMutation = useCreateDish();
  const updateMutation = useUpdateDish();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/dishes');
    }
  };

  const onSubmit = async (values: z.infer<typeof dishSchema>) => {
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
        ...payloadBase,
      };
      await updateMutation.mutateAsync({ id: dish.id, input: payload });
      handleSuccess();
      return;
    }

    await createMutation.mutateAsync(payloadBase);
    handleSuccess();
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
  const ingredientError = form.formState.errors.ingredients as
    | FieldError
    | FieldError[]
    | undefined;
  const ingredientMessage = Array.isArray(ingredientError)
    ? ingredientError[0]?.message
    : ingredientError?.message;

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
        className="space-y-6 pb-16"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Dish name" />
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
                <Textarea {...field} rows={3} placeholder="Optional notes about the dish" />
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
                    <SelectValue placeholder="Select meal type" />
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
            <FormItem className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <FormLabel className="text-sm font-medium">Use for generation…</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Inactive dishes are excluded when creating menus.
                  </p>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    aria-label="Use for generation"
                  />
                </FormControl>
              </div>
              <FormMessage />
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

        {ingredients.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Add ingredients to your library before creating dishes.
          </p>
        ) : null}

        <FormActions>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              className="h-12"
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="h-12"
              type="submit"
              disabled={isSubmitting || ingredients.length === 0}
            >
              {ingredients.length === 0
                ? 'Add ingredients first'
                : isSubmitting
                  ? 'Saving...'
                  : 'Save'}
            </Button>
          </div>
        </FormActions>
      </form>
    </Form>
  );
}
