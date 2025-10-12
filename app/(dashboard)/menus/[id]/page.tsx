'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useDeleteMenu, useMenuQuery, useUpdateMenuStatus } from '@/data-access/hooks';
import { statusOptions } from '@/lib/enums';

import { MenuItemsTable } from './_components/MenuItemsTable';

export default function MenuDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const menuId = params?.id ?? '';

  const menuQuery = useMenuQuery(menuId);
  const statusMutation = useUpdateMenuStatus(menuId);
  const deleteMutation = useDeleteMenu();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const menu = menuQuery.data;

  const formattedDate = useMemo(() => {
    if (!menu) return '';
    return new Date(menu.createdAt).toLocaleString();
  }, [menu]);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(menuId);
    setConfirmDelete(false);
    router.push('/menus');
  };

  return (
    <div className="space-y-6">
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
      <Separator />

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

      {menu ? (
        <>
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={menu.status === 'draft' ? 'secondary' : 'default'}>
                    {menu.status}
                  </Badge>
                </div>
                <Select
                  value={menu.status}
                  onValueChange={(next) => statusMutation.mutate(next as typeof menu.status)}
                  disabled={statusMutation.isPending}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground">Created {formattedDate}</div>
            </CardContent>
          </Card>

          <MenuItemsTable menuId={menuId} items={menu.items} />
        </>
      ) : null}

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
