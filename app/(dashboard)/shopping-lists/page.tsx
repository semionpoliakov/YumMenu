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
import { useDeleteShoppingList, useShoppingListsQuery } from '@/data-access/hooks';

export default function ShoppingListsPage() {
  const listsQuery = useShoppingListsQuery();
  const deleteMutation = useDeleteShoppingList();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

  const lists = listsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Header title="Shopping Lists" />

      {listsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-20 w-full" />
          ))}
        </div>
      ) : null}

      {listsQuery.error ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Failed to load shopping lists.
          </CardContent>
        </Card>
      ) : null}

      {!listsQuery.isLoading && lists.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No shopping lists yet.
          </CardContent>
        </Card>
      ) : null}

      {lists.length > 0 ? (
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
              {lists.map((list) => (
                <TableRow key={list.id}>
                  <TableCell className="font-medium">{list.name}</TableCell>
                  <TableCell>
                    <Badge variant={list.status === 'draft' ? 'secondary' : 'default'}>
                      {list.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(list.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Link
                      href={`/shopping-lists/${list.id}`}
                      className="text-sm text-primary underline"
                    >
                      View
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingDelete({ id: list.id, name: list.name })}
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
        title="Delete shopping list?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : undefined}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
