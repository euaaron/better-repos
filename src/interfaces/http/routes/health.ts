import { buildCorsHeaders } from '../cors';
import type { Env } from '../../../config';

export function handleHealthRoute(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin');

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
      },
    },
  );
}
