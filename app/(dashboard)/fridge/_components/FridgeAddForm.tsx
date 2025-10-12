'use client';

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
import { useUpsertFridgeItem } from '@/data-access/hooks';
import { nonEmptyString, stringToNumber, useZodForm } from '@/lib/forms';

import type { IngredientDto } from '@/contracts';

const fridgeFormSchema = z.object({
  ingredientId: nonEmptyString,
  quantity: z.string().refine((value) => {
    const parsed = stringToNumber(value);
    return parsed !== undefined && parsed >= 0;
  }, 'Enter a quantity ≥ 0'),
});

type FridgeFormValues = z.infer<typeof fridgeFormSchema>;

type FridgeAddFormProps = {
  ingredients: IngredientDto[];
};

export function FridgeAddForm({ ingredients }: FridgeAddFormProps) {
  const upsertMutation = useUpsertFridgeItem();
  const form = useZodForm(fridgeFormSchema, {
    defaultValues: {
      ingredientId: ingredients[0]?.id ?? '',
      quantity: '1',
    },
  });

  const onSubmit = async (values: FridgeFormValues) => {
    const quantity = stringToNumber(values.quantity);
    if (quantity === undefined) {
      return;
    }

    await upsertMutation.mutateAsync({ ingredientId: values.ingredientId, quantity });
    form.reset({
      ingredientId: values.ingredientId,
      quantity: '1',
    });
  };

  const disabled = ingredients.length === 0 || upsertMutation.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
        className="space-y-3"
      >
        <FormField
          control={form.control}
          name="ingredientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingredient</FormLabel>
              <FormControl>
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
        <Button type="submit" className="w-full" disabled={disabled}>
          {ingredients.length === 0
            ? 'Add ingredients first'
            : upsertMutation.isPending
              ? 'Saving...'
              : 'Add to fridge'}
        </Button>
      </form>
    </Form>
  );
}
