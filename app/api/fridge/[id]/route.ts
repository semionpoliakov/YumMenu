import { handleJson } from '@/lib/responses';
import { fridgeController } from '@/modules/fridge/controller';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handleJson(() => fridgeController.update(request, params));
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return handleJson(() => fridgeController.delete(request, params), 204);
}
