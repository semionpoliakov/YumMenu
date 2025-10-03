import { createId } from '@/lib/ids';

export interface GenerateMenuResult {
  menuId: string;
  shoppingListId: string;
}

export function generateMenu(): GenerateMenuResult {
  return {
    menuId: createId(),
    shoppingListId: createId(),
  };
}
