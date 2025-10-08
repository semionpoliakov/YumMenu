import { z } from 'zod';

import {
  GenerateRequest,
  type GenerateResponseDto,
  type MenuItemDto,
  type MenuListItemDto,
  type MenuViewDto,
} from '@/contracts';
import { parseBody } from '@/lib/http';

import { menusService } from './service';

const generateBodySchema = GenerateRequest;
const regenerateBodySchema = GenerateRequest;
const updateMenuItemBodySchema = z.object({ cooked: z.boolean() });
const lockBodySchema = z.object({
  itemIds: z.array(z.string()),
  locked: z.boolean(),
});

export const menusController = {
  async list(): Promise<MenuListItemDto[]> {
    return menusService.list();
  },

  async generate(request: Request): Promise<GenerateResponseDto> {
    const body = await parseBody(request, generateBodySchema);
    return menusService.generate(body);
  },

  async get(_request: Request, params: { id: string }): Promise<MenuViewDto> {
    return menusService.get(params.id);
  },

  async regenerate(request: Request, params: { id: string }): Promise<GenerateResponseDto> {
    const body = await parseBody(request, regenerateBodySchema);
    return menusService.regenerate(params.id, body);
  },

  async updateItem(request: Request, params: { id: string; itemId: string }): Promise<MenuItemDto> {
    const body = await parseBody(request, updateMenuItemBodySchema);
    return menusService.updateMenuItemCooked(params.id, params.itemId, body.cooked);
  },

  async lock(request: Request, params: { id: string }): Promise<MenuItemDto[]> {
    const body = await parseBody(request, lockBodySchema);
    return menusService.lockMenuItems(params.id, body.itemIds, body.locked);
  },

  async delete(_request: Request, params: { id: string }): Promise<void> {
    await menusService.delete(params.id);
  },
};
