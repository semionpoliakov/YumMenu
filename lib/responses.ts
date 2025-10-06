import { toHttpError } from './errors';

export const handleJson = async <T>(callback: () => Promise<T>, status = 200) => {
  try {
    const data = await callback();
    console.log(data, 'data123');
    if (status === 204) {
      return new Response(null, { status });
    }
    return Response.json(data, { status });
  } catch (error) {
    console.log(error, 'error123');
    const httpError = toHttpError(error);
    return Response.json(httpError.body, { status: httpError.status });
  }
};
