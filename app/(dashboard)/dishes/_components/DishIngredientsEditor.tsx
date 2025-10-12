'use client';

import { PlusCircle, Trash2 } from 'lucide-react';
import { useWatch, type Control, type FieldArrayWithId } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { DishFormValues } from './types';
import type { IngredientDto } from '@/contracts';

type DishIngredientsEditorProps = {
  control: Control<DishFormValues>;
  fields: FieldArrayWithId<DishFormValues, 'ingredients'>[];
  ingredientOptions: IngredientDto[];
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export function DishIngredientsEditor({
  control,
  fields,
  ingredientOptions,
  onAdd,
  onRemove,
}: DishIngredientsEditorProps) {
  const watchedIngredients = useWatch({ control, name: 'ingredients' });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Ingredients</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add
        </Button>
      </div>
      <div className="space-y-4">
        {fields.map((field, index) => {
          const selection = watchedIngredients?.[index];
          const selectedIngredient = ingredientOptions.find(
            (ingredient) => ingredient.id === selection?.ingredientId,
          );

          return (
            <div key={field.id} className="rounded-lg border border-border p-3 space-y-3">
              <FormField
                control={control}
                name={`ingredients.${index}.ingredientId` as const}
                render={({ field: ingredientField }) => (
                  <FormItem>
                    <FormLabel>Ingredient</FormLabel>
                    <FormControl>
                      <Select
                        value={ingredientField.value}
                        onValueChange={ingredientField.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientOptions.map((ingredient) => (
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
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                <FormField
                  control={control}
                  name={`ingredients.${index}.qtyPerServing` as const}
                  render={({ field: quantityField }) => (
                    <FormItem>
                      <FormLabel>Qty per serving</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          value={quantityField.value ?? ''}
                          onChange={(event) => quantityField.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {selectedIngredient ? selectedIngredient.unit.toUpperCase() : ''}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
