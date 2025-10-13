'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useLockMenuItems,
  useMenuQuery,
  useRegenerateMenu,
  useUpdateMenuStatus,
} from '@/data-access/hooks';
import { mealTypeOptions } from '@/lib/enums';

const mealTypeLabel = Object.fromEntries(
  mealTypeOptions.map((option) => [option.value, option.label]),
);

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const menuId = params?.id ?? '';
  const router = useRouter();

  const menuQuery = useMenuQuery(menuId);
  const lockMutation = useLockMenuItems(menuId);
  const regenerateMutation = useRegenerateMenu(menuId);
  const statusMutation = useUpdateMenuStatus(menuId);

  const menu = menuQuery.data;

  const totalSlots = useMemo(() => {
    if (!menu) return {};
    return mealTypeOptions.reduce<Record<string, number>>((acc, option) => {
      const count = menu.items.filter((item) => item.mealType === option.value).length;
      if (count > 0) {
        acc[option.value] = count;
      }
      return acc;
    }, {});
  }, [menu]);

  const handleToggleLock = async (itemId: string, locked: boolean) => {
    await lockMutation.mutateAsync({ itemIds: [itemId], locked });
  };

  const handleRegenerate = async () => {
    if (!menu) return;
    await regenerateMutation.mutateAsync({
      name: menu.name,
      totalSlots,
    });
  };

  const handleSave = async () => {
    await statusMutation.mutateAsync('final');
    router.replace(`/menus/${menuId}/options`);
  };

  return (
    <div className="space-y-6 pb-6">
      <Header title={menu?.name ?? 'Checkout'} />

      {menuQuery.isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : menuQuery.error ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            Failed to load menu. Please refresh the page.
          </CardContent>
        </Card>
      ) : menu ? (
        <>
          <div className="space-y-3">
            {menu.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{item.dishName}</p>
                    <p className="text-xs text-muted-foreground">
                      {mealTypeLabel[item.mealType] ?? item.mealType}
                    </p>
                  </div>
                  <Label
                    htmlFor={`checkout-item-${item.id}-locked`}
                    className="flex items-center gap-2 text-sm font-semibold capitalize text-foreground"
                  >
                    <Checkbox
                      id={`checkout-item-${item.id}-locked`}
                      checked={item.locked}
                      onCheckedChange={(checked) => {
                        void handleToggleLock(item.id, checked === true);
                      }}
                      aria-label="Locked"
                      disabled={lockMutation.isPending}
                    />
                    locked
                  </Label>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                void handleRegenerate();
              }}
              disabled={regenerateMutation.isPending}
            >
              {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate'}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                void handleSave();
              }}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Menu not found.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
