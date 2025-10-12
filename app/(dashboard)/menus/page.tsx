'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDeleteMenu, useMenusQuery } from '@/data-access/hooks';

export default function MenusPage() {
  const menusQuery = useMenusQuery();
  const deleteMutation = useDeleteMenu();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

  const menus = menusQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Header title="Menus" />

      {menusQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-20 w-full" />
          ))}
        </div>
      ) : null}

      {menusQuery.error ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Failed to load menus.
          </CardContent>
        </Card>
      ) : null}

      {!menusQuery.isLoading && menus.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No menus yet. Generate one to see it here.
          </CardContent>
        </Card>
      ) : null}

      {menus.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell className="font-medium">{menu.name}</TableCell>
                  <TableCell>
                    <Badge variant={menu.status === 'draft' ? 'secondary' : 'default'}>
                      {menu.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(menu.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Link href={`/menus/${menu.id}`} className="text-sm text-primary underline">
                      View
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete({ id: menu.id, name: menu.name })}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete menu?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : undefined}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
