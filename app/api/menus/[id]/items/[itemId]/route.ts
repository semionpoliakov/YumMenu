import { handleJson } from '@/lib/responses';
import { menusController } from '@/modules/menus/controller';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; itemId: string } },
) {
  return handleJson(() => menusController.updateItem(request, params));
}
