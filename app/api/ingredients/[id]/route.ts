import { handleJson } from '@/lib/responses';
import { ingredientsController } from '@/modules/ingredients/controller';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return handleJson(() => ingredientsController.update(request, params));
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return handleJson(() => ingredientsController.delete(request, params), 204);
}
