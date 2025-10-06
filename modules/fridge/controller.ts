import { FridgeItemCreate, FridgeItemUpdate, type FridgeItemDto } from '@/contracts';
import { parseBody } from '@/lib/http';

import { fridgeService } from './service';

const createBodySchema = FridgeItemCreate;
const updateBodySchema = FridgeItemUpdate;

export const fridgeController = {
  async list(): Promise<FridgeItemDto[]> {
    return fridgeService.list();
  },

  async upsert(request: Request): Promise<FridgeItemDto> {
    const body = await parseBody(request, createBodySchema);
    return fridgeService.upsert(body);
  },

  async update(request: Request, params: { id: string }): Promise<FridgeItemDto> {
    const body = await parseBody(request, updateBodySchema);
    return fridgeService.update(params.id, body);
  },

  async delete(_request: Request, params: { id: string }): Promise<void> {
    await fridgeService.delete(params.id);
  },
};
