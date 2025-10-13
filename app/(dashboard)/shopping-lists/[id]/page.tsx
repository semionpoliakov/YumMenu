'use client';

import { useParams } from 'next/navigation';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useShoppingListQuery } from '@/data-access/hooks';

import { ShoppingListItemsTable } from './_components/ShoppingListItemsTable';

export default function ShoppingListDetailPage() {
  const params = useParams<{ id: string }>();
  const listId = params?.id ?? '';
  const listQuery = useShoppingListQuery(listId);
  const list = listQuery.data;

  return (
    <div className="space-y-6 pb-6">
      <Header title={list?.name ?? 'Shopping List'} />

      {listQuery.isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : null}

      {listQuery.error ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Failed to load shopping list.
          </CardContent>
        </Card>
      ) : null}

      {list ? <ShoppingListItemsTable listId={listId} items={list.items} /> : null}
    </div>
  );
}
