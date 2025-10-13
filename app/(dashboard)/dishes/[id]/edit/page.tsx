'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDishesQuery, useIngredientsQuery } from '@/data-access/hooks';

import { DishForm } from '../../_components/DishForm';

export default function DishEditPage() {
  const params = useParams<{ id: string }>();
  const dishId = params?.id ?? '';

  const dishesQuery = useDishesQuery();
  const ingredientsQuery = useIngredientsQuery();

  const dish = useMemo(
    () => dishesQuery.data?.find((item) => item.id === dishId),
    [dishesQuery.data, dishId],
  );

  const isLoading = dishesQuery.isLoading || ingredientsQuery.isLoading;
  const hasError = dishesQuery.error || ingredientsQuery.error;

  return (
    <div className="space-y-6">
      <Header title="Edit Dish" />

      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : hasError ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            Unable to load dish or ingredients. Please try again later.
          </CardContent>
        </Card>
      ) : dish ? (
        <DishForm ingredients={ingredientsQuery.data ?? []} dish={dish} />
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Dish not found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
