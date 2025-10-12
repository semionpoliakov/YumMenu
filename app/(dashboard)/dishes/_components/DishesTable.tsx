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
import { useDeleteDish } from '@/data-access/hooks';
import { mealTypeOptions } from '@/lib/enums';

import { DishFormDialog } from './DishFormDialog';

import type { DishWithIngredientsDto, IngredientDto } from '@/contracts';

const mealTypeLabel = Object.fromEntries(mealTypeOptions.map((item) => [item.value, item.label]));

type DishesTableProps = {
  dishes?: DishWithIngredientsDto[];
  isLoading?: boolean;
  ingredientOptions: IngredientDto[];
};

type PendingDelete = { id: string; name: string } | null;

export function DishesTable({ dishes, isLoading, ingredientOptions }: DishesTableProps) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const deleteMutation = useDeleteDish();

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!dishes || dishes.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No dishes yet. Create one to add it to your menus.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {dishes.map((dish) => (
          <Card key={dish.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-semibold">{dish.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {mealTypeLabel[dish.mealType] ?? dish.mealType}
                  </p>
                </div>
                <Badge variant={dish.isActive ? 'secondary' : 'outline'}>
                  {dish.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {dish.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {dish.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Ingredients</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {dish.ingredients.map((item) => (
                    <li key={`${dish.id}-${item.name}`}>
                      {item.name} · {item.qtyPerServing} {item.unit}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-end gap-2">
                <DishFormDialog
                  trigger={
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                  ingredients={ingredientOptions}
                  dish={dish}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPendingDelete({ id: dish.id, name: dish.name })}
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
              <TableHead>Meal type</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dishes.map((dish) => (
              <TableRow key={dish.id}>
                <TableCell className="font-medium">{dish.name}</TableCell>
                <TableCell>{mealTypeLabel[dish.mealType] ?? dish.mealType}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {dish.tags.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      dish.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={dish.isActive ? 'secondary' : 'outline'}>
                    {dish.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <DishFormDialog
                    trigger={
                      <Button variant="outline" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                    ingredients={ingredientOptions}
                    dish={dish}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPendingDelete({ id: dish.id, name: dish.name })}
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
        title="Delete dish?"
        description={pendingDelete ? `This will remove ${pendingDelete.name}.` : undefined}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
