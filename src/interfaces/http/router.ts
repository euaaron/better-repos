import { ProjectService } from '../../application/ProjectService';
import { getAllowedOrigins, type Env } from '../../config';

const DEFAULT_PAGE_SIZE = 10;

const OPENAPI_SPEC = {
  openapi: '3.0.0',
  info: {
    title: 'Better Repos',
    version: '1.0.0',
    description:
      'A Cloudflare Worker that exposes a GitHub profile’s repositories with metadata, tags, README content, and related project suggestions.',
  },
  servers: [{ url: '/', description: 'Current Cloudflare Worker' }],
  paths: {
    '/': {
      get: {
        summary: 'OpenAPI documentation',
        responses: {
          '200': {
            description: 'HTML documentation page',
          },
        },
      },
    },
    '/repos': {
      get: {
        summary: 'List repositories',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Optional page number for paginated results. When omitted, all repositories are returned unless page_size is explicitly used.',
            required: false,
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'page_size',
            in: 'query',
            description: 'Optional page size to control how many items are returned in a paginated response.',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Returns either the full repository list or a paginated result object with metadata.',
          },
        },
      },
    },
    '/repos/{repoName}': {
      get: {
        summary: 'Get a single repository by name or URL fragment',
        parameters: [
          {
            name: 'repoName',
            in: 'path',
            description: 'Repository name or URL fragment to match.',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Returns the matching repository.',
          },
          '404': {
            description: 'Repository not found.',
          },
        },
      },
    },
  },
};

function buildCorsHeaders(origin: string | null, env: Env) {
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

function renderRootPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Better Repos</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html { box-sizing: border-box; }
      *, *:before, *:after { box-sizing: inherit; }
      body { margin: 0; background: #f5f5f5; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
          persistAuthorization: true,
        });
      };
    </script>
  </body>
</html>`;
}

function normalizePositiveInteger(value: string | null, name: string): number | null {
  if (value === null) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsedValue;
}

function paginateRepositories(repositories: any[], page: number | null, pageSize: number) {
  const resolvedPage = page ?? 1;
  const totalRepositories = repositories.length;
  const totalPages = totalRepositories === 0 ? 0 : Math.ceil(totalRepositories / pageSize);
  const safePage = Math.min(resolvedPage, totalPages === 0 ? 1 : totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    content: repositories.slice(startIndex, endIndex),
    page: safePage,
    pageSize,
    totalPages,
    totalRepositories,
  };
}

function buildPaginationHeaders(page: number, pageSize: number, totalRepositories: number): Headers {
  const totalPages = totalRepositories === 0 ? 0 : Math.ceil(totalRepositories / pageSize);
  const headers = new Headers();

  headers.set('X-Page', String(page));
  headers.set('X-Page-Size', String(pageSize));
  headers.set('X-Total-Count', String(totalRepositories));
  headers.set('X-Total-Pages', String(totalPages));

  return headers;
}

function getPaginationConfig(request: Request, url: URL) {
  const queryPage = normalizePositiveInteger(url.searchParams.get('page'), 'page');
  const queryPageSize = normalizePositiveInteger(url.searchParams.get('page_size'), 'page_size');
  const headerPage = normalizePositiveInteger(request.headers.get('X-Page'), 'X-Page');
  const headerPageSize = normalizePositiveInteger(request.headers.get('X-Page-Size'), 'X-Page-Size');

  const page = headerPage ?? queryPage;
  const pageSize = headerPageSize ?? queryPageSize ?? DEFAULT_PAGE_SIZE;
  const isPaginatedRequest =
    request.headers.has('X-Page') ||
    request.headers.has('X-Page-Size') ||
    url.searchParams.has('page') ||
    url.searchParams.has('page_size');

  return { page, pageSize, isPaginatedRequest };
}

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
    return new Response(renderRootPage(), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
      },
    });
  }

  if (url.pathname === '/docs') {
    return new Response(renderRootPage(), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
      },
    });
  }

  if (url.pathname === '/openapi.json') {
    return new Response(JSON.stringify(OPENAPI_SPEC, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
      },
    });
  }

  if (url.pathname === '/repos') {
    try {
      const { page, pageSize, isPaginatedRequest } = getPaginationConfig(request, url);
      const repositories = await service.getAll();
      const responseHeaders = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
      });

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
      return new Response(JSON.stringify({ message: error instanceof Error ? error.message : 'Unexpected error' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
        },
      });
    }
  }

  if (url.pathname.startsWith('/repos/')) {
    try {
      const repoName = url.pathname.replace('/repos/', '').trim();
      const repositories = await service.getAll();
      const project = repositories.find(
        (item) =>
          item.name.toLowerCase() === repoName.toLowerCase() ||
          item.url.toLowerCase().includes(repoName.toLowerCase()),
      );

      return new Response(JSON.stringify(project ?? { message: 'Repository not found' }), {
        status: project ? 200 : 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ message: error instanceof Error ? error.message : 'Unexpected error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
        },
      });
    }
  }

  return new Response(JSON.stringify({ message: 'Not found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
    },
  });
}
