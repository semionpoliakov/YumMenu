import { handleJson } from '@/lib/responses';
import { dishesController } from '@/modules/dishes/controller';

export const runtime = 'nodejs';

export async function GET() {
  return handleJson(() => dishesController.list());
}

export async function POST(request: Request) {
  return handleJson(() => dishesController.create(request), 201);
}
