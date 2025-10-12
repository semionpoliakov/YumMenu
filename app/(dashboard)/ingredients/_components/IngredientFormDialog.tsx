'use client';

import { useEffect, useState, type ReactNode } from 'react';
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

type IngredientFormDialogProps = {
  ingredient?: IngredientDto;
  trigger: ReactNode;
};

export function IngredientFormDialog({ ingredient, trigger }: IngredientFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(ingredient);

  const form = useZodForm(ingredientSchema, {
    defaultValues: {
      name: ingredient?.name ?? '',
      unit: ingredient?.unit ?? unitOptions[0]?.value ?? 'pcs',
      isActive: ingredient?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: ingredient?.name ?? '',
        unit: ingredient?.unit ?? unitOptions[0]?.value ?? 'pcs',
        isActive: ingredient?.isActive ?? true,
      });
    }
  }, [ingredient, form, open]);

  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: IngredientFormValues) => {
    if (isEdit && ingredient) {
      const payload: IngredientUpdateInput = {};
      if (values.name !== ingredient.name) payload.name = values.name;
      if (values.isActive !== ingredient.isActive) payload.isActive = values.isActive;
      if (Object.keys(payload).length === 0) {
        setOpen(false);
        return;
      }
      await updateMutation.mutateAsync({ id: ingredient.id, input: payload });
      setOpen(false);
      return;
    }

    await createMutation.mutateAsync({
      name: values.name,
      unit: values.unit,
      isActive: values.isActive,
    });
    form.reset({
      name: '',
      unit: values.unit,
      isActive: true,
    });
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset({
        name: ingredient?.name ?? '',
        unit: ingredient?.unit ?? unitOptions[0]?.value ?? 'pcs',
        isActive: ingredient?.isActive ?? true,
      });
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Ingredient' : 'New Ingredient'}</DialogTitle>
        </DialogHeader>
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
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus placeholder="Tomato" />
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
                <FormItem className="flex flex-row items-center justify-between rounded-md border border-border p-2">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {isEdit ? (
              <p className="text-xs text-muted-foreground">
                Unit cannot be changed after an ingredient is referenced by dishes.
              </p>
            ) : null}
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
