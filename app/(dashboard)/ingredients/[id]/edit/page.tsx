'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIngredientsQuery } from '@/data-access/hooks';

import { IngredientForm } from '../../_components/IngredientForm';

export default function IngredientEditPage() {
  const params = useParams<{ id: string }>();
  const ingredientId = params?.id ?? '';
  const { data, isLoading, error } = useIngredientsQuery();

  const ingredient = useMemo(
    () => data?.find((item) => item.id === ingredientId),
    [data, ingredientId],
  );

  return (
    <div className="space-y-6">
      <Header title="Edit Ingredient" />

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : error ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            Failed to load ingredient. Please try again later.
          </CardContent>
        </Card>
      ) : ingredient ? (
        <IngredientForm ingredient={ingredient} />
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Ingredient not found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
