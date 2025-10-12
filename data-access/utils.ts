export type TsRestResponse<T> = { status: number; body: T };

export class TsRestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Request failed with status ${status}`);
    this.name = 'TsRestError';
  }
}

export const unwrap = <TSuccess>(
  result: { status: number; body: unknown },
  expectedStatuses: readonly number[] = [200],
): TSuccess => {
  if (expectedStatuses.includes(result.status)) {
    return result.body as TSuccess;
  }
  throw new TsRestError(result.status, result.body);
};

export const unwrapOptional = <TSuccess>(
  result: { status: number; body: TSuccess | null },
  expectedStatuses: readonly number[] = [200, 204],
): TSuccess | null => {
  if (expectedStatuses.includes(result.status)) {
    return result.body;
  }
  throw new TsRestError(result.status, result.body);
};
