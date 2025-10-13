'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
            <Button
              size="sm"
              variant={item.bought ? 'outline' : 'secondary'}
              onClick={() => {
                void handleToggle(item.id, !item.bought);
              }}
              disabled={toggleMutation.isPending}
            >
              {item.bought ? 'Undo' : 'Bought'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
