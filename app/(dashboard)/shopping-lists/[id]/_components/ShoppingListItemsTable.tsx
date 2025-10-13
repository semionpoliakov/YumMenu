'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToggleShoppingListItem } from '@/data-access/hooks';

import type { ShoppingListItemDto } from '@/contracts';

type ShoppingListItemsTableProps = {
  listId: string;
  items: ShoppingListItemDto[];
};

export function ShoppingListItemsTable({ listId, items }: ShoppingListItemsTableProps) {
  const [localItems, setLocalItems] = useState(items);
  const toggleMutation = useToggleShoppingListItem(listId);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleToggle = async (itemId: string, bought: boolean) => {
    const updated = await toggleMutation.mutateAsync({ itemId, bought });
    setLocalItems((previous) =>
      previous.map((item) => (item.id === updated.id ? { ...item, bought: updated.bought } : item)),
    );
  };

  return (
    <div className="space-y-3">
      {localItems.map((item) => (
        <Card key={item.id} className={item.bought ? 'bg-muted/40' : undefined}>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} {item.unit}
              </p>
            </div>
            <Label
              htmlFor={`shopping-item-${item.id}-bought`}
              className="flex items-center gap-2 text-sm font-semibold capitalize text-foreground"
            >
              <Checkbox
                id={`shopping-item-${item.id}-bought`}
                checked={item.bought}
                onCheckedChange={(checked) => {
                  void handleToggle(item.id, checked === true);
                }}
                aria-label="Bought"
                disabled={toggleMutation.isPending}
              />
              bought
            </Label>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
