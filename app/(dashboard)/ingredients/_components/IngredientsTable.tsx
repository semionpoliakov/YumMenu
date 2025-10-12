'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

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
import { useDeleteIngredient } from '@/data-access/hooks';

import { IngredientFormDialog } from './IngredientFormDialog';

import type { IngredientDto } from '@/contracts';

type IngredientsTableProps = {
  ingredients?: IngredientDto[];
  isLoading?: boolean;
};

type PendingDelete = { id: string; name: string } | null;

export function IngredientsTable({ ingredients, isLoading }: IngredientsTableProps) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const deleteMutation = useDeleteIngredient();

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!ingredients || ingredients.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No ingredients yet. Start by adding your first one.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {ingredients.map((ingredient) => (
          <Card key={ingredient.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ingredient.name}</p>
                  <p className="text-xs text-muted-foreground uppercase">{ingredient.unit}</p>
                </div>
                <Badge variant={ingredient.isActive ? 'secondary' : 'outline'}>
                  {ingredient.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-end gap-2">
                <IngredientFormDialog
                  ingredient={ingredient}
                  trigger={
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPendingDelete({ id: ingredient.id, name: ingredient.name })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((ingredient) => (
              <TableRow key={ingredient.id}>
                <TableCell className="font-medium">{ingredient.name}</TableCell>
                <TableCell className="uppercase">{ingredient.unit}</TableCell>
                <TableCell>
                  <Badge variant={ingredient.isActive ? 'secondary' : 'outline'}>
                    {ingredient.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <IngredientFormDialog
                    ingredient={ingredient}
                    trigger={
                      <Button variant="outline" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPendingDelete({ id: ingredient.id, name: ingredient.name })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete ingredient?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : undefined}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
