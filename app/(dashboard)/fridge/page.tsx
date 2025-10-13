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
import { useDeleteFridgeItem, useFridgeQuery } from '@/data-access/hooks';

export default function FridgePage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useFridgeQuery();
  const deleteMutation = useDeleteFridgeItem();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6 pb-6">
      <Header title="Fridge" />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center text-sm text-destructive">
            <p>Failed to load fridge items.</p>
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
          {data.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer"
              onClick={() => router.push(`/fridge/${item.id}/edit`)}
            >
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${item.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDelete({ id: item.id, name: item.name });
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
            Fridge is empty. Add your first ingredient.
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Remove item?"
        description={
          pendingDelete ? `This will remove ${pendingDelete.name} from your fridge.` : undefined
        }
        confirmLabel="Remove"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />

      <AddFab href="/fridge/create" label="Add to fridge" />
    </div>
  );
}
