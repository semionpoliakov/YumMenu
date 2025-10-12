'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useLockMenuItems, useUpdateMenuItemCooked } from '@/data-access/hooks';
import { mealTypeOptions } from '@/lib/enums';

import type { MenuViewDto } from '@/contracts';

const mealTypeLabel = Object.fromEntries(mealTypeOptions.map((item) => [item.value, item.label]));

type MenuItemsTableProps = {
  menuId: string;
  items: MenuViewDto['items'];
};

export function MenuItemsTable({ menuId, items }: MenuItemsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localItems, setLocalItems] = useState<MenuViewDto['items']>(items);

  const lockMutation = useLockMenuItems(menuId);
  const cookedMutation = useUpdateMenuItemCooked(menuId);

  useEffect(() => {
    setLocalItems(items);
    setSelectedIds([]);
  }, [items]);

  const toggleSelection = (itemId: string, checked: boolean) => {
    setSelectedIds((previous) =>
      checked ? Array.from(new Set([...previous, itemId])) : previous.filter((id) => id !== itemId),
    );
  };

  const handleLock = async (locked: boolean) => {
    if (selectedIds.length === 0) return;
    const updated = await lockMutation.mutateAsync({ itemIds: selectedIds, locked });
    setLocalItems((previous) =>
      previous.map((item) => {
        const match = updated.find((entry) => entry.id === item.id);
        return match ? { ...item, locked: match.locked } : item;
      }),
    );
    setSelectedIds([]);
  };

  const toggleCooked = async (itemId: string, cooked: boolean) => {
    const updated = await cookedMutation.mutateAsync({ itemId, cooked });
    setLocalItems((previous) =>
      previous.map((item) => (item.id === updated.id ? { ...item, cooked: updated.cooked } : item)),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={selectedIds.length === 0 || lockMutation.isPending}
          onClick={() => {
            void handleLock(true);
          }}
        >
          {lockMutation.isPending ? 'Updating...' : 'Lock selected'}
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
      </div>
      <Separator />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Select</TableHead>
              <TableHead>Dish</TableHead>
              <TableHead>Meal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cooked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localItems.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <TableRow key={item.id} className={item.locked ? 'bg-muted/40' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(selected) => toggleSelection(item.id, Boolean(selected))}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.dishName}</TableCell>
                  <TableCell>{mealTypeLabel[item.mealType] ?? item.mealType}</TableCell>
                  <TableCell>
                    <Badge variant={item.locked ? 'secondary' : 'outline'}>
                      {item.locked ? 'Locked' : 'Unlocked'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={item.cooked ? 'secondary' : 'outline'}
                      onClick={() => {
                        void toggleCooked(item.id, !item.cooked);
                      }}
                      disabled={cookedMutation.isPending}
                    >
                      {item.cooked ? 'Cooked' : 'Mark cooked'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
