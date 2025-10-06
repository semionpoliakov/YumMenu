import { DishCreate, DishUpdate, type DishDto, type DishWithIngredientsDto } from '@/contracts';
import { parseBody } from '@/lib/http';

import { dishesService } from './service';

const createBodySchema = DishCreate;
const updateBodySchema = DishUpdate;

export const dishesController = {
  async list(): Promise<DishWithIngredientsDto[]> {
    return dishesService.list();
  },

  async create(request: Request): Promise<DishDto> {
    const body = await parseBody(request, createBodySchema);
    return dishesService.create(body);
  },

  async update(request: Request, params: { id: string }): Promise<DishDto> {
    const body = await parseBody(request, updateBodySchema);
    return dishesService.update(params.id, body);
  },

  async delete(_request: Request, params: { id: string }): Promise<void> {
    await dishesService.delete(params.id);
  },
};
