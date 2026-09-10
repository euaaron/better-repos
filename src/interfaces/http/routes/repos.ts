import { ProjectService } from '../../../application/ProjectService';
import type { Env } from '../../../config';
import { buildJsonHeaders } from '../cors';
import { jsonErrorResponse } from '../errors';
import { buildPaginationHeaders, getPaginationConfig, paginateRepositories } from '../pagination';

export async function handleReposRoute(request: Request, env: Env, service: ProjectService): Promise<Response> {
  const origin = request.headers.get('Origin');
  const url = new URL(request.url);

  try {
    const { page, pageSize, isPaginatedRequest } = getPaginationConfig(request, url);
    const repositories = await service.getAll();
    const responseHeaders = buildJsonHeaders(origin, env);

    if (!isPaginatedRequest) {
      return new Response(JSON.stringify(repositories), {
        status: 200,
        headers: responseHeaders,
      });
    }

    const paginatedResponse = paginateRepositories(repositories, page, pageSize);
    const paginationHeaders = buildPaginationHeaders(
      paginatedResponse.page,
      paginatedResponse.pageSize,
      paginatedResponse.totalRepositories,
    );

    for (const [key, value] of paginationHeaders.entries()) {
      responseHeaders.set(key, value);
    }

    return new Response(JSON.stringify(paginatedResponse), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = message.toLowerCase().includes('must be a positive integer') ? 400 : 500;
    return jsonErrorResponse(status, status === 400 ? 'INVALID_QUERY' : 'UPSTREAM_ERROR', message);
  }
}

export async function handleRepoRoute(
  request: Request,
  env: Env,
  service: ProjectService,
  routeBasePath = '/repos',
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const url = new URL(request.url);

  try {
    const repoName = url.pathname.replace(`${routeBasePath}/`, '').trim();
    const repositories = await service.getAll();
    const project = repositories.find(
      (item) =>
        item.name.toLowerCase() === repoName.toLowerCase() ||
        item.url.toLowerCase().includes(repoName.toLowerCase()),
    );

    if (!project) {
      return jsonErrorResponse(404, 'NOT_FOUND', 'Repository not found');
    }

    return new Response(JSON.stringify(project), {
      status: 200,
      headers: buildJsonHeaders(origin, env),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonErrorResponse(500, 'UPSTREAM_ERROR', message);
  }
}
