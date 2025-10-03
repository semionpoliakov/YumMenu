import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const contracts = c.router({
  health: {
    method: 'GET',
    path: '/api/health',
    responses: {
      200: z.object({
        ok: z.boolean(),
      }),
    },
    summary: 'Health check endpoint',
  },
});

export type AppContract = typeof contracts;
