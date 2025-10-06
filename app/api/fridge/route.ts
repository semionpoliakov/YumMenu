import { handleJson } from '@/lib/responses';
import { fridgeController } from '@/modules/fridge/controller';

export const runtime = 'nodejs';

export async function GET() {
  return handleJson(() => fridgeController.list());
}

export async function POST(request: Request) {
  return handleJson(() => fridgeController.upsert(request));
}
