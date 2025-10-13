'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDeleteMenu, useMenuQuery } from '@/data-access/hooks';

import { MenuItemsTable } from './_components/MenuItemsTable';

export default function MenuDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const menuId = params?.id ?? '';

  const menuQuery = useMenuQuery(menuId);
  const deleteMutation = useDeleteMenu();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const menu = menuQuery.data;

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(menuId);
    setConfirmDelete(false);
    router.push('/menus');
  };

  return (
    <div className="space-y-6 pb-6">
      <Header
        title={menu?.name ?? 'Menu'}
        rightSlot={
          menu ? (
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          ) : null
        }
      />

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

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete menu?"
        description="This action removes the menu and its shopping list."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
