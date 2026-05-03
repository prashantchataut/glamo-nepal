import { corsHeaders } from './cors.ts';
import type { ErrorResponse, PaginatedResponse, SuccessResponse } from './types.ts';

export function success<T>(data: T, status = 200, message = 'Success'): Response {
  const headers = corsHeaders(undefined);
  const body: SuccessResponse<T> = {
    success: true,
    message,
    data,
    pagination: null,
  };
  return Response.json(body, { status, headers });
}

export function error(message: string, status = 500, errors: string[] = []): Response {
  const headers = corsHeaders(undefined);
  const body: ErrorResponse = {
    success: false,
    message,
    errors,
  };
  return Response.json(body, { status, headers });
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
  message = 'Success'
): Response {
  const headers = corsHeaders(undefined);
  const totalPages = Math.ceil(total / perPage);
  const body: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
    },
  };
  return Response.json(body, { status: 200, headers });
}

export function validationError(zodError: { errors: { path: (string | number)[]; message: string }[] }): Response {
  const formattedErrors = zodError.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return error('Validation failed', 400, formattedErrors);
}

export function notFound(entity: string): Response {
  return error(`${entity} not found`, 404);
}

export function unauthorized(message = 'Unauthorized'): Response {
  return error(message, 401);
}

export function forbidden(message = 'Forbidden: insufficient permissions'): Response {
  return error(message, 403);
}