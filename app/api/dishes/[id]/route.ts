import { handleJson } from '@/lib/responses';
import { dishesController } from '@/modules/dishes/controller';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handleJson(() => dishesController.update(request, params));
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return handleJson(() => dishesController.delete(request, params), 204);
}
