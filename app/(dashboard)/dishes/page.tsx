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
import { useDeleteDish, useDishesQuery } from '@/data-access/hooks';

export default function DishesPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useDishesQuery();
  const deleteMutation = useDeleteDish();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6 pb-6">
      <Header title="Dishes" />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center text-sm text-destructive">
            <p>Failed to load dishes.</p>
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
          {data.map((dish) => (
            <Card
              key={dish.id}
              className="cursor-pointer"
              onClick={() => router.push(`/dishes/${dish.id}/edit`)}
            >
              <CardContent className="flex items-center justify-between">
                <p className="font-medium">{dish.name}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${dish.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDelete({ id: dish.id, name: dish.name });
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
            No dishes yet. Add one to start planning.
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete dish?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : undefined}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      <AddFab href="/dishes/create" label="Add dish" />
    </div>
  );
}
