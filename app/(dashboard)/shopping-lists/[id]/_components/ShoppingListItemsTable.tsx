'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {localItems.map((item) => (
          <TableRow key={item.id} className={item.bought ? 'bg-muted/40' : undefined}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              {item.quantity} {item.unit}
            </TableCell>
            <TableCell>
              <Badge variant={item.bought ? 'secondary' : 'outline'}>
                {item.bought ? 'Bought' : 'Pending'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant={item.bought ? 'outline' : 'secondary'}
                onClick={() => {
                  void handleToggle(item.id, !item.bought);
                }}
                disabled={toggleMutation.isPending}
              >
                {item.bought ? 'Mark unbought' : 'Mark bought'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
