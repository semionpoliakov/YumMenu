'use client';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDishesQuery, useIngredientsQuery } from '@/data-access/hooks';

import { DishesTable } from './_components/DishesTable';
import { DishFormDialog } from './_components/DishFormDialog';

export default function DishesPage() {
  const dishesQuery = useDishesQuery();
  const ingredientsQuery = useIngredientsQuery('all');

  const ingredients = ingredientsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Header
        title="Dishes"
        rightSlot={
          <DishFormDialog
            trigger={
              <Button size="sm" className="min-w-[120px]">
                + Add Dish
              </Button>
            }
            ingredients={ingredients}
          />
        }
      />
      <Separator />

      {ingredientsQuery.error ? (
        <Card>
          <CardContent className="space-y-3 py-4 text-sm text-destructive">
            <p>Failed to load ingredients. Dish forms will be disabled until retry succeeds.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void ingredientsQuery.refetch();
              }}
            >
              Retry ingredients
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {dishesQuery.error ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center text-sm text-muted-foreground">
            <p>Failed to load dishes.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void dishesQuery.refetch();
              }}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DishesTable
          dishes={dishesQuery.data}
          isLoading={dishesQuery.isLoading}
          ingredientOptions={ingredients}
        />
      )}
    </div>
  );
}
