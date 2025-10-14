import { handleJson } from '@/lib/responses';
import { shoppingListsController } from '@/modules/shoppingLists/controller';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return handleJson(() => shoppingListsController.get(request, params));
}
