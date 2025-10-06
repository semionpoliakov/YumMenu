import { handleJson } from '@/lib/responses';
import { shoppingListsController } from '@/modules/shoppingLists/controller';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; itemId: string } },
) {
  return handleJson(() => shoppingListsController.updateItem(request, params));
}
