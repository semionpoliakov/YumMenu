import { handleJson } from '@/lib/responses';
import { shoppingListsController } from '@/modules/shoppingLists/controller';

export const runtime = 'nodejs';

export async function GET() {
  return handleJson(() => shoppingListsController.list());
}
