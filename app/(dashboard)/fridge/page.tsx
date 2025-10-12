'use client';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useFridgeQuery, useIngredientsQuery } from '@/data-access/hooks';

import { FridgeAddForm } from './_components/FridgeAddForm';
import { FridgeTable } from './_components/FridgeTable';

export default function FridgePage() {
  const fridgeQuery = useFridgeQuery();
  const ingredientsQuery = useIngredientsQuery('all');
  const ingredients = ingredientsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Header title="Fridge" />
      <Separator />

      <Card>
        <CardContent className="space-y-4 p-4">
          <h2 className="text-sm font-semibold">Add to fridge</h2>
          <FridgeAddForm ingredients={ingredients} />
          {ingredients.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No ingredients available. Create ingredients first to add them to your fridge.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {fridgeQuery.error ? (
        <Card>
          <CardContent className="space-y-2 py-6 text-center text-sm text-muted-foreground">
            <p>Failed to load fridge items.</p>
          </CardContent>
        </Card>
      ) : (
        <FridgeTable items={fridgeQuery.data} isLoading={fridgeQuery.isLoading} />
      )}
    </div>
  );
}
