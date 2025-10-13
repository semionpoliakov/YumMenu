'use client';

import { ArrowRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteShoppingList, useShoppingListsQuery } from '@/data-access/hooks';

export default function ShoppingListsPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useShoppingListsQuery();
  const deleteMutation = useDeleteShoppingList();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6 pb-6">
      <Header title="Shopping lists" />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center text-sm text-destructive">
            <p>Failed to load shopping lists.</p>
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
          {data.map((list) => (
            <Card
              key={list.id}
              className="cursor-pointer"
              onClick={() => router.push(`/shopping-lists/${list.id}`)}
            >
              <CardContent className="flex items-center justify-between">
                <p className="font-medium">{list.name}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Open ${list.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/shopping-lists/${list.id}`);
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${list.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingDelete({ id: list.id, name: list.name });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No shopping lists yet.
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete shopping list?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : undefined}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
