'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeleteFridgeItem, useUpdateFridgeItem } from '@/data-access/hooks';
import { numberToString, stringToNumber } from '@/lib/forms';

import type { FridgeItemDto } from '@/contracts';

const MIN_QUANTITY = 0;

type FridgeTableProps = {
  items?: FridgeItemDto[];
  isLoading?: boolean;
};

type PendingDelete = { id: string; name: string } | null;

type FridgeRowProps = {
  item: FridgeItemDto;
  onAskDelete: (item: FridgeItemDto) => void;
};

function FridgeRow({ item, onAskDelete }: FridgeRowProps) {
  const [quantity, setQuantity] = useState(numberToString(item.quantity));
  const updateMutation = useUpdateFridgeItem();

  useEffect(() => {
    setQuantity(numberToString(item.quantity));
  }, [item.quantity]);

  const handleSave = async () => {
    const parsed = stringToNumber(quantity);
    if (parsed === undefined || parsed < MIN_QUANTITY) {
      setQuantity(numberToString(item.quantity));
      return;
    }
    await updateMutation.mutateAsync({ id: item.id, input: { quantity: parsed } });
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell className="uppercase">{item.unit}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={MIN_QUANTITY}
            step="0.1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-24"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void handleSave();
            }}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" onClick={() => onAskDelete(item)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function FridgeCardRow({ item, onAskDelete }: FridgeRowProps) {
  const [quantity, setQuantity] = useState(numberToString(item.quantity));
  const updateMutation = useUpdateFridgeItem();

  useEffect(() => {
    setQuantity(numberToString(item.quantity));
  }, [item.quantity]);

  const handleSave = async () => {
    const parsed = stringToNumber(quantity);
    if (parsed === undefined || parsed < MIN_QUANTITY) {
      setQuantity(numberToString(item.quantity));
      return;
    }
    await updateMutation.mutateAsync({ id: item.id, input: { quantity: parsed } });
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.unit.toUpperCase()}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onAskDelete(item)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={MIN_QUANTITY}
            step="0.1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void handleSave();
            }}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FridgeTable({ items, isLoading }: FridgeTableProps) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const deleteMutation = useDeleteFridgeItem();

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Your fridge is empty. Add ingredients to track stock.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <FridgeCardRow
            key={item.id}
            item={item}
            onAskDelete={(selected) => setPendingDelete({ id: selected.id, name: selected.name })}
          />
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <FridgeRow
                key={item.id}
                item={item}
                onAskDelete={(selected) =>
                  setPendingDelete({ id: selected.id, name: selected.name })
                }
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Remove from fridge?"
        description={
          pendingDelete ? `This will remove ${pendingDelete.name} from your fridge.` : undefined
        }
        confirmLabel="Remove"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
