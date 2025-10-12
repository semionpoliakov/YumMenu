'use client';

import { useState } from 'react';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useIngredientsQuery } from '@/data-access/hooks';

import { IngredientFormDialog } from './_components/IngredientFormDialog';
import { IngredientsTable } from './_components/IngredientsTable';

import type { IngredientActiveFilter } from '@/data-access/hooks';

const filterOptions: Array<{ label: string; value: IngredientActiveFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

export default function IngredientsPage() {
  const [filter, setFilter] = useState<IngredientActiveFilter>('all');
  const { data, isLoading, error, refetch } = useIngredientsQuery(filter);

  return (
    <div className="space-y-6">
      <Header
        title="Ingredients"
        rightSlot={
          <IngredientFormDialog
            trigger={
              <Button size="sm" className="min-w-[120px]">
                + Add Ingredient
              </Button>
            }
          />
        }
      />
      <Separator />

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Filter</span>
        <Select value={filter} onValueChange={(value: IngredientActiveFilter) => setFilter(value)}>
          <SelectTrigger className="w-[160px] text-left">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center text-sm text-muted-foreground">
            <p>Failed to load ingredients.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <IngredientsTable ingredients={data} isLoading={isLoading} />
      )}
    </div>
  );
}
