import { handleJson } from '@/lib/responses';
import { menusController } from '@/modules/menus/controller';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return handleJson(() => menusController.get(request, params));
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return handleJson(() => menusController.delete(request, params), 204);
}
