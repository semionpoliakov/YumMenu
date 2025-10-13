'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFridgeQuery, useIngredientsQuery } from '@/data-access/hooks';

import { FridgeForm } from '../../_components/FridgeForm';

export default function FridgeEditPage() {
  const params = useParams<{ id: string }>();
  const itemId = params?.id ?? '';

  const fridgeQuery = useFridgeQuery();
  const ingredientsQuery = useIngredientsQuery();

  const item = useMemo(
    () => fridgeQuery.data?.find((entry) => entry.id === itemId),
    [fridgeQuery.data, itemId],
  );

  const isLoading = fridgeQuery.isLoading || ingredientsQuery.isLoading;
  const hasError = fridgeQuery.error || ingredientsQuery.error;

  return (
    <div className="space-y-6">
      <Header title="Edit fridge item" />

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : hasError ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            Unable to load fridge item. Please try again later.
          </CardContent>
        </Card>
      ) : item ? (
        <FridgeForm item={item} ingredients={ingredientsQuery.data ?? []} />
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Fridge item not found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
