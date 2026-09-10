import { getAllowedOrigins, type Env } from '../../config';

export function buildCorsHeaders(origin: string | null, env: Env): Headers {
  const allowedOrigins = getAllowedOrigins(env);
  const isAllowed = !origin || allowedOrigins.includes(origin);

  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  });

  if (isAllowed && origin) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return headers;
}

export function buildJsonHeaders(origin: string | null, env: Env): Headers {
  return new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
  });
}
