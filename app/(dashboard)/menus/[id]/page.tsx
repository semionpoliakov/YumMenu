'use client';

import { useParams } from 'next/navigation';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { useMenuQuery } from '@/data-access/hooks';

import { MenuItemsTable } from './_components/MenuItemsTable';

export default function MenuDetailPage() {
  const params = useParams<{ id: string }>();
  const menuId = params?.id ?? '';

  const menuQuery = useMenuQuery(menuId);
  const menu = menuQuery.data;

  return (
    <div className="space-y-6 pb-6">
      <Header title={menu?.name ?? 'Menu'} />

      {menuQuery.isLoading ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Loading menu...
          </CardContent>
        </Card>
      ) : null}

      {menuQuery.error ? (
        <Card>
          <CardContent className="space-y-2 py-6 text-center text-sm text-muted-foreground">
            <p>Failed to load menu.</p>
          </CardContent>
        </Card>
      ) : null}

      {menu ? <MenuItemsTable menuId={menuId} items={menu.items} /> : null}
    </div>
  );
}
