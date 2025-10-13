'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
import { IngredientCreate } from '@/contracts';
import { useCreateIngredient, useUpdateIngredient } from '@/data-access/hooks';
import { unitOptions } from '@/lib/enums';
import { nonEmptyString, useZodForm } from '@/lib/forms';

import type { IngredientDto, IngredientUpdateInput } from '@/contracts';

const ingredientSchema = IngredientCreate.extend({
  name: nonEmptyString,
  isActive: z.boolean().default(true),
});

type IngredientFormValues = z.infer<typeof ingredientSchema>;

type IngredientFormProps = {
  ingredient?: IngredientDto;
  onSuccess?: () => void;
};

export function IngredientForm({ ingredient, onSuccess }: IngredientFormProps) {
  const router = useRouter();
  const isEdit = Boolean(ingredient);

  const form = useZodForm(ingredientSchema, {
    defaultValues: {
      name: ingredient?.name ?? '',
      unit: ingredient?.unit ?? unitOptions[0]?.value ?? 'pcs',
      isActive: ingredient?.isActive ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      name: ingredient?.name ?? '',
      unit: ingredient?.unit ?? unitOptions[0]?.value ?? 'pcs',
      isActive: ingredient?.isActive ?? true,
    });
  }, [ingredient, form]);

  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push('/ingredients');
    }
  };

  const onSubmit = async (values: IngredientFormValues) => {
    if (isEdit && ingredient) {
      const payload: IngredientUpdateInput = {};
      if (values.name !== ingredient.name) payload.name = values.name;
      if (values.isActive !== ingredient.isActive) payload.isActive = values.isActive;
      if (Object.keys(payload).length === 0) {
        handleSuccess();
        return;
      }
      await updateMutation.mutateAsync({ id: ingredient.id, input: payload });
      handleSuccess();
      return;
    }

    await createMutation.mutateAsync({
      name: values.name,
      unit: values.unit,
      isActive: values.isActive,
    });
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Tomato" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((option) => (
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
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <FormLabel className="text-sm font-medium">Available for dishes</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Inactive ingredients are hidden when building dishes and menus.
                  </p>
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-input accent-primary"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                </FormControl>
              </div>
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
