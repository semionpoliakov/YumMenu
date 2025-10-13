'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import { useUpdateFridgeItem, useUpsertFridgeItem } from '@/data-access/hooks';
import { nonEmptyString, stringToNumber, useZodForm } from '@/lib/forms';

import type { FridgeItemDto, IngredientDto } from '@/contracts';

const baseSchema = z.object({
  ingredientId: nonEmptyString,
  quantity: z.string().refine((value) => {
    const parsed = stringToNumber(value);
    return parsed !== undefined && parsed >= 0;
  }, 'Enter a quantity ≥ 0'),
});

type FridgeFormValues = z.infer<typeof baseSchema>;

type FridgeFormProps = {
  item?: FridgeItemDto;
  ingredients: IngredientDto[];
  onSuccess?: () => void;
};

export function FridgeForm({ item, ingredients, onSuccess }: FridgeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(item);

  const matchedIngredient = useMemo(
    () => (item ? ingredients.find((ingredient) => ingredient.name === item.name) : undefined),
    [ingredients, item],
  );

  const initialIngredientId = isEdit
    ? (matchedIngredient?.id ?? 'existing')
    : (ingredients[0]?.id ?? '');

  const form = useZodForm(baseSchema, {
    defaultValues: {
      ingredientId: initialIngredientId,
      quantity: item ? String(item.quantity) : '1',
    },
  });

  useEffect(() => {
    form.reset({
      ingredientId: initialIngredientId,
      quantity: item ? String(item.quantity) : '1',
    });
  }, [item, ingredients, initialIngredientId, form]);

  const upsertMutation = useUpsertFridgeItem();
  const updateMutation = useUpdateFridgeItem();
  const isSubmitting = upsertMutation.isPending || updateMutation.isPending;

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/fridge');
    }
  };

  const onSubmit = async (values: FridgeFormValues) => {
    const quantity = stringToNumber(values.quantity);
    if (quantity === undefined) {
      return;
    }

    if (isEdit && item) {
      await updateMutation.mutateAsync({ id: item.id, input: { quantity } });
      handleSuccess();
      return;
    }

    await upsertMutation.mutateAsync({ ingredientId: values.ingredientId, quantity });
    handleSuccess();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="ingredientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingredient</FormLabel>
              <FormControl>
                {isEdit ? (
                  <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm font-medium">
                    {item?.name}
                  </div>
                ) : (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={ingredients.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || (!isEdit && ingredients.length === 0)}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {!isEdit && ingredients.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Add ingredients first to start filling the fridge.
          </p>
        ) : null}
      </form>
    </Form>
  );
}
