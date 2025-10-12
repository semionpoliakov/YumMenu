'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLockMenuItems, useRegenerateMenu } from '@/data-access/hooks';
import { mealTypeOptions } from '@/lib/enums';

import type {
  GenerateRequestInput,
  GenerateResponseDto,
  MenuItemDto,
  ShoppingListItemDto,
} from '@/contracts';

const mealTypeLabel = Object.fromEntries(mealTypeOptions.map((item) => [item.value, item.label]));

type CheckoutCardProps = {
  data: GenerateResponseDto;
  payload: GenerateRequestInput;
  onUpdate: (result: GenerateResponseDto) => void;
};

export function CheckoutCard({ data, payload, onUpdate }: CheckoutCardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [items, setItems] = useState<MenuItemDto[]>(data.items);

  const lockMutation = useLockMenuItems(data.menu.id);
  const regenerateMutation = useRegenerateMenu(data.menu.id);

  useEffect(() => {
    setItems(data.items);
    setSelectedIds([]);
  }, [data.items, data.menu.id]);

  const handleToggle = (itemId: string, checked: boolean) => {
    setSelectedIds((previous) => {
      if (checked) {
        return Array.from(new Set([...previous, itemId]));
      }
      return previous.filter((id) => id !== itemId);
    });
  };

  const handleLock = async (locked: boolean) => {
    if (selectedIds.length === 0) return;
    const updated = await lockMutation.mutateAsync({ itemIds: selectedIds, locked });
    setItems((previous) =>
      previous.map((item) => {
        const update = updated.find((entry) => entry.id === item.id);
        return update ? { ...item, locked: update.locked } : item;
      }),
    );
    setSelectedIds([]);
  };

  const handleRegenerate = async () => {
    const result = await regenerateMutation.mutateAsync(payload);
    onUpdate(result);
  };

  const shoppingListItems = useMemo(() => data.shoppingList.items, [data.shoppingList.items]);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span>{data.menu.name}</span>
          <Badge variant={data.menu.status === 'draft' ? 'secondary' : 'default'}>
            {data.menu.status}
          </Badge>
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          <Link href={`/menus/${data.menu.id}`} className="text-sm text-primary underline">
            View menu details
          </Link>
          <Link
            href={`/shopping-lists/${data.shoppingList.id}`}
            className="text-sm text-primary underline"
          >
            View shopping list
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={selectedIds.length === 0 || lockMutation.isPending}
            onClick={() => {
              void handleLock(true);
            }}
          >
            {lockMutation.isPending ? 'Processing...' : 'Lock selected'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={selectedIds.length === 0 || lockMutation.isPending}
            onClick={() => {
              void handleLock(false);
            }}
          >
            Unlock
          </Button>
          <Button
            size="sm"
            variant="default"
            disabled={regenerateMutation.isPending}
            onClick={() => {
              void handleRegenerate();
            }}
          >
            {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate others'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Select</TableHead>
                <TableHead>Dish</TableHead>
                <TableHead>Meal</TableHead>
                <TableHead>Locked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <TableRow key={item.id} className={item.locked ? 'bg-muted/40' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(selected) => handleToggle(item.id, Boolean(selected))}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.dishName}</TableCell>
                    <TableCell>{mealTypeLabel[item.mealType] ?? item.mealType}</TableCell>
                    <TableCell>
                      <Badge variant={item.locked ? 'secondary' : 'outline'}>
                        {item.locked ? 'Locked' : 'Unlocked'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Shopping list highlights</h3>
          {shoppingListItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">No additional ingredients required.</p>
          ) : (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {shoppingListItems.map((item: ShoppingListItemDto) => (
                <li key={item.id}>
                  {item.name} · {item.quantity} {item.unit}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
