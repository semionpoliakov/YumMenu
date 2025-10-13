'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
            <Label
              htmlFor={`menu-item-${item.id}-cooked`}
              className="flex items-center gap-2 text-sm font-semibold capitalize text-foreground"
            >
              <Checkbox
                id={`menu-item-${item.id}-cooked`}
                checked={item.cooked}
                onCheckedChange={(checked) => {
                  void toggleCooked(item.id, checked === true);
                }}
                aria-label="Cooked"
                disabled={cookedMutation.isPending}
              />
              cooked
            </Label>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
