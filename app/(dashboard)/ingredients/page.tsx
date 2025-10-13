'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AddFab } from '@/components/AddFab';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteIngredient, useIngredientsQuery } from '@/data-access/hooks';

export default function IngredientsPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useIngredientsQuery();
  const deleteMutation = useDeleteIngredient();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6 pb-6">
      <Header title="Ingredients" />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-20 w-full rounded-xl" />
          ))}
        </div>
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
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((ingredient) => (
            <Card
              key={ingredient.id}
              className="cursor-pointer transition hover:shadow-md"
              onClick={() => router.push(`/ingredients/${ingredient.id}/edit`)}
            >
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ingredient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ingredient.unit.toUpperCase()} · {ingredient.isActive ? 'Available' : 'Hidden'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${ingredient.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDelete({ id: ingredient.id, name: ingredient.name });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No ingredients yet. Add your first one to get started.
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete ingredient?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : undefined}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      <AddFab href="/ingredients/create" label="Add ingredient" />
    </div>
  );
}
