import { handleJson } from '@/lib/responses';
import { ingredientsController } from '@/modules/ingredients/controller';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return handleJson(() => ingredientsController.list(request));
}

export async function POST(request: Request) {
  return handleJson(() => ingredientsController.create(request), 201);
}
