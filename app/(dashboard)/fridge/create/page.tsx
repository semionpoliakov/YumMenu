'use client';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIngredientsQuery } from '@/data-access/hooks';

import { FridgeForm } from '../_components/FridgeForm';

export default function FridgeCreatePage() {
  const { data: ingredients, isLoading, error, refetch } = useIngredientsQuery();

  return (
    <div className="space-y-6">
      <Header title="Add to fridge" />

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : error ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center text-sm text-destructive">
            <p>Failed to load ingredients.</p>
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
        <FridgeForm ingredients={ingredients ?? []} />
      )}
    </div>
  );
}
