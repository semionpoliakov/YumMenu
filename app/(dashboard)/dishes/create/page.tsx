'use client';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIngredientsQuery } from '@/data-access/hooks';

import { DishForm } from '../_components/DishForm';

export default function DishCreatePage() {
  const { data: ingredients, isLoading, error, refetch } = useIngredientsQuery();

  return (
    <div className="space-y-6">
      <Header title="New Dish" />

      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : error ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center text-sm text-destructive">
            <p>Failed to load ingredients for dishes.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DishForm ingredients={ingredients ?? []} />
      )}
    </div>
  );
}
