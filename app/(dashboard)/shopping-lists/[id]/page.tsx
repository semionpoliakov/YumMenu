'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';

import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useShoppingListQuery } from '@/data-access/hooks';

import { ShoppingListItemsTable } from './_components/ShoppingListItemsTable';

export default function ShoppingListDetailPage() {
  const params = useParams<{ id: string }>();
  const listId = params?.id ?? '';
  const listQuery = useShoppingListQuery(listId);
  const list = listQuery.data;

  const formattedDate = useMemo(() => {
    if (!list) return '';
    return new Date(list.createdAt).toLocaleString();
  }, [list]);

  return (
    <div className="space-y-6">
      <Header title={list?.name ?? 'Shopping List'} />
      <Separator />

      {listQuery.isLoading ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Loading list...
          </CardContent>
        </Card>
      ) : null}

      {listQuery.error ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Failed to load shopping list.
          </CardContent>
        </Card>
      ) : null}

      {list ? (
        <>
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={list.status === 'draft' ? 'secondary' : 'default'}>
                    {list.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">Created {formattedDate}</div>
              </div>
            </CardContent>
          </Card>

          <ShoppingListItemsTable listId={listId} items={list.items} />
        </>
      ) : null}
    </div>
  );
}
