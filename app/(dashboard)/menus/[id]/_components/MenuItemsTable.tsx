'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUpdateMenuItemCooked } from '@/data-access/hooks';
import { mealTypeOptions } from '@/lib/enums';

import type { MenuViewDto } from '@/contracts';

const mealTypeLabel = Object.fromEntries(mealTypeOptions.map((item) => [item.value, item.label]));

type MenuItemsTableProps = {
  menuId: string;
  items: MenuViewDto['items'];
};

export function MenuItemsTable({ menuId, items }: MenuItemsTableProps) {
  const [localItems, setLocalItems] = useState<MenuViewDto['items']>(items);

  const cookedMutation = useUpdateMenuItemCooked(menuId);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const toggleCooked = async (itemId: string, cooked: boolean) => {
    const updated = await cookedMutation.mutateAsync({ itemId, cooked });
    setLocalItems((previous) =>
      previous.map((item) => (item.id === updated.id ? { ...item, cooked: updated.cooked } : item)),
    );
  };

  return (
    <div className="space-y-3">
      {localItems.map((item) => (
        <Card key={item.id} className={item.locked ? 'bg-muted/40' : undefined}>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">{item.dishName}</p>
              <p className="text-xs text-muted-foreground">
                {mealTypeLabel[item.mealType] ?? item.mealType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={item.cooked ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  void toggleCooked(item.id, !item.cooked);
                }}
                aria-label={item.cooked ? 'Mark as not cooked' : 'Mark as cooked'}
                disabled={cookedMutation.isPending}
              >
                {item.cooked ? 'Undo' : 'Cooked'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
