import { handleJson } from '@/lib/responses';
import { menusController } from '@/modules/menus/controller';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return handleJson(() => menusController.regenerate(request, params));
}
