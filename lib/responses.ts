import { toHttpError } from './errors';

const logError = (error: unknown) => {
  if (error instanceof Error) {
    console.error(error.stack ?? error);
  } else {
    console.error(error);
  }
};

export const handleError = (error: unknown) => {
  const httpError = toHttpError(error);
  if (httpError.status >= 500) {
    logError(error);
  }
  return Response.json(httpError.body, { status: httpError.status });
};

export const handleJson = async <T>(callback: () => Promise<T>, status = 200) => {
  try {
    const data = await callback();
    if (status === 204) {
      return new Response(null, { status });
    }
    return Response.json(data, { status });
  } catch (error) {
    return handleError(error);
  }
};
