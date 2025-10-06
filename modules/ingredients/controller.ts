import { z } from 'zod';

import { IngredientCreate, IngredientUpdate, type IngredientDto } from '@/contracts';
import { parseBody, parseQuery } from '@/lib/http';

import { ingredientsService } from './service';

import type { IngredientActiveFilter } from './repo';

const listQuerySchema = z.object({
  active: z.enum(['true', 'false', 'all']).optional(),
});
const createBodySchema = IngredientCreate;
const updateBodySchema = IngredientUpdate;

export const ingredientsController = {
  async list(request: Request): Promise<IngredientDto[]> {
    const parsed = parseQuery(request, listQuerySchema);
    const filter: IngredientActiveFilter = parsed.active ?? 'all';
    return ingredientsService.list(filter);
  },

  async create(request: Request): Promise<IngredientDto> {
    const body = await parseBody(request, createBodySchema);
    return ingredientsService.create(body);
  },

  async update(request: Request, params: { id: string }): Promise<IngredientDto> {
    const body = await parseBody(request, updateBodySchema);
    return ingredientsService.update(params.id, body);
  },

  async delete(_request: Request, params: { id: string }): Promise<void> {
    await ingredientsService.delete(params.id);
  },
};
