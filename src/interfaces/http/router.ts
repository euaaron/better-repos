import { ProjectService } from '../../application/ProjectService';
import { getAllowedOrigins, type Env } from '../../config';

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
            name: 'name',
            in: 'query',
            description: 'A repository name or URL fragment to return a single match.',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Returns a list of repositories or a single matching repository.',
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

  if (url.pathname === '/repos' || url.pathname.startsWith('/repos/')) {
    try {
      const nameFromQuery = url.searchParams.get('name')?.trim();
      const nameFromPath = url.pathname === '/repos' ? '' : url.pathname.replace('/repos/', '').trim();
      const repoName = nameFromQuery || nameFromPath || null;

      const projects = await service.getAll();
      const project = repoName
        ? projects.find(
            (item) =>
              item.name.toLowerCase() === repoName.toLowerCase() ||
              item.url.toLowerCase().includes(repoName.toLowerCase()),
          )
        : null;

      return new Response(
        JSON.stringify(project ? project : repoName ? { message: 'Repository not found' } : projects),
        {
          status: repoName && !project ? 404 : 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
          },
        },
      );
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
