import { initClient } from '@ts-rest/core';

import { contracts } from '@/contracts';

export const apiClient = initClient(contracts, {
  baseUrl: '',
  baseHeaders: {},
});

export type ApiClient = typeof apiClient;
