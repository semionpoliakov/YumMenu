import { toHttpError } from './errors';

export const handleJson = async <T>(callback: () => Promise<T>, status = 200) => {
  try {
    const data = await callback();
    if (status === 204) {
      return new Response(null, { status });
    }
    return Response.json(data, { status });
  } catch (error) {
    const httpError = toHttpError(error);
    return Response.json(httpError.body, { status: httpError.status });
  }
};
