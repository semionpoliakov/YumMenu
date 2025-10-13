'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMenuQuery, useShoppingListsQuery } from '@/data-access/hooks';

export default function MenuOptionsPage() {
  const params = useParams<{ id: string }>();
  const menuId = params?.id ?? '';
  const router = useRouter();

  const menuQuery = useMenuQuery(menuId);
  const shoppingListsQuery = useShoppingListsQuery();

  const shoppingListId = useMemo(() => {
    if (!menuQuery.data || !shoppingListsQuery.data) return undefined;
    const targetTime = Number(new Date(menuQuery.data.createdAt));
    const byTimestamp = shoppingListsQuery.data.find(
      (list) => Number(new Date(list.createdAt)) === targetTime,
    );
    if (byTimestamp) return byTimestamp.id;
    const byName = shoppingListsQuery.data.find((list) => list.name === menuQuery.data?.name);
    return byName?.id;
  }, [menuQuery.data, shoppingListsQuery.data]);

  return (
    <div className="space-y-6 pb-6">
      <Header title="Menu actions" />

      {menuQuery.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : menuQuery.error ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            Failed to load menu.
          </CardContent>
        </Card>
      ) : menuQuery.data ? (
        <div className="space-y-3">
          <Card
            className="cursor-pointer transition hover:shadow-md"
            onClick={() => router.push(`/menus/${menuId}`)}
          >
            <CardContent className="flex items-center justify-between">
              <p className="font-medium">View dishes</p>
            </CardContent>
          </Card>
          <Card
            className={shoppingListId ? 'cursor-pointer transition hover:shadow-md' : 'opacity-50'}
            onClick={() => {
              if (shoppingListId) router.push(`/shopping-lists/${shoppingListId}`);
            }}
          >
            <CardContent className="flex items-center justify-between">
              <p className="font-medium">View shopping list</p>
              {!shoppingListId ? (
                <span className="text-xs text-muted-foreground">List unavailable</span>
              ) : null}
            </CardContent>
          </Card>
        </div>
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
