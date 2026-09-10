import { ProjectService } from '../../application/ProjectService';
import type { Env } from '../../config';
import { jsonErrorResponse } from './errors';
import { buildCorsHeaders, buildJsonHeaders } from './cors';
import { handleRepoRoute, handleReposRoute } from './routes/repos';
import { handleHealthRoute } from './routes/health';
import { handleInfoRoute } from './routes/info';
import { handleRootRoute } from './routes/root';
import { openApiSpec } from './openapi';

export async function handleRequest(request: Request, env: Env, service: ProjectService): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(origin, env),
    });
  }

  if (url.pathname === '/') {
    return handleRootRoute(request, env);
  }

  if (url.pathname === '/docs') {
    return handleRootRoute(request, env);
  }

  if (url.pathname === '/health') {
    return handleHealthRoute(request, env);
  }

  if (url.pathname === '/info') {
    return handleInfoRoute(request, env);
  }

  if (url.pathname === '/openapi.json') {
    return new Response(JSON.stringify(openApiSpec, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
      },
    });
  }

  if (url.pathname === '/repos' || url.pathname === '/projects') {
    return handleReposRoute(request, env, service);
  }

  if (url.pathname.startsWith('/repos/')) {
    return handleRepoRoute(request, env, service, '/repos');
  }

  if (url.pathname.startsWith('/projects/')) {
    return handleRepoRoute(request, env, service, '/projects');
  }

  return jsonErrorResponse(404, 'NOT_FOUND', 'Not found');
}
