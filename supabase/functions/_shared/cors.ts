const PRODUCTION_ORIGINS = [
  'https://glamonepal.com',
  'https://www.glamonepal.com',
];

const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
];

const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? PRODUCTION_ORIGINS
  : [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS];

const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With, X-Idempotency-Key';
const EXPOSED_HEADERS = 'X-Total-Count';
const MAX_AGE = '86400';

export function corsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : PRODUCTION_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Expose-Headers': EXPOSED_HEADERS,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': MAX_AGE,
  };
}

export function handleCorsPreflightRequest(request: Request): Response {
  const origin = request.headers.get('Origin') || undefined;
  const headers = corsHeaders(origin);
  return new Response(null, { status: 204, headers });
}