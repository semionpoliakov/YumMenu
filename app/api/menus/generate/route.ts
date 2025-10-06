import { handleJson } from '@/lib/responses';
import { menusController } from '@/modules/menus/controller';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return handleJson(() => menusController.generate(request), 201);
}
