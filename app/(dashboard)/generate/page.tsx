'use client';

import { useState } from 'react';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDishesQuery, useIngredientsQuery } from '@/data-access/hooks';

import { CheckoutCard } from './_components/CheckoutCard';
import { GenerateForm } from './_components/GenerateForm';

import type { GenerateRequestInput, GenerateResponseDto } from '@/contracts';

export default function GeneratePage() {
  const dishesQuery = useDishesQuery();
  const ingredientsQuery = useIngredientsQuery('all');

  const [lastResult, setLastResult] = useState<{
    response: GenerateResponseDto;
    payload: GenerateRequestInput;
  } | null>(null);

  return (
    <div className="space-y-6 pb-8">
      <Header title="Generate" />
      <Separator />

      <GenerateForm
        dishes={dishesQuery.data ?? []}
        ingredients={ingredientsQuery.data ?? []}
        onSuccess={(response, payload) => setLastResult({ response, payload })}
      />

      {lastResult ? (
        <CheckoutCard
          data={lastResult.response}
          payload={lastResult.payload}
          onUpdate={(updated) =>
            setLastResult({
              response: updated,
              payload: { ...lastResult.payload, name: updated.menu.name },
            })
          }
        />
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Generate a menu to preview it here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
