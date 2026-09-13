export function createOpenApiSpec(requestUrl?: string) {
  const resolvedUrl = requestUrl ? new URL(requestUrl) : null;
  const serverUrl = resolvedUrl ? `${resolvedUrl.protocol}//${resolvedUrl.host}` : '/';

  return {
    openapi: '3.0.0',
    info: {
      title: 'Better Repos',
      version: '1.0.0',
      description:
        'A Cloudflare Worker that exposes a GitHub profile’s repositories with related project suggestions.',
    },
    servers: [{ url: serverUrl, description: 'Current Cloudflare Worker' }],
    tags: [
      { name: 'Default', description: 'Repository collection and repository detail endpoints.' },
      { name: 'Observability', description: 'Health and metadata endpoints for runtime inspection.' },
    ],
    'x-tagGroups': [
      { name: 'Default', tags: ['Default'] },
      { name: 'Observability', tags: ['Observability'] },
    ],
    components: {
      schemas: {
        ErrorResponse: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Observability'],
          summary: 'Health check endpoint',
          responses: {
            '200': {
              description: 'API health status.',
              content: {
                'application/json': {
                  example: {
                    status: 'ok',
                    timestamp: '2026-09-10T12:00:00.000Z',
                  },
                },
              },
            },
          },
        },
      },
      '/info': {
        get: {
          tags: ['Observability'],
          summary: 'Service metadata',
          responses: {
            '200': {
              description: 'Application information including build metadata.',
              content: {
                'application/json': {
                  example: {
                    name: 'better-repos',
                    version: '2.0.0',
                    build: {
                      commit: 'abc123',
                      date: '2026-09-10T12:00:00.000Z',
                    },
                    environment: 'development'
                  },
                },
              },
            },
            '500': {
              description: 'Required deployment or runtime configuration is missing.',
              content: {
                'application/json': {
                  example: {
                    error: {
                      code: 'CONFIG_ERROR',
                      message: 'APP_NAME is required. Set it in your environment or GitHub Actions variables.',
                      details: null,
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/repos': {
        get: {
          tags: ['Default'],
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
              content: {
                'application/json': {
                  example: {
                    page: 1,
                    pageSize: 10,
                    totalPages: 3,
                    totalRepositories: 25,
                    content: [
                      {
                        name: 'better-repos',
                        fullName: 'octocat/better-repos',
                        url: 'https://github.com/octocat/better-repos',
                        description: 'Example repository',
                      },
                    ],
                  },
                },
              },
            },
            '400': {
              description: 'Invalid pagination parameters.',
              content: {
                'application/json': {
                  example: {
                    error: {
                      code: 'INVALID_QUERY',
                      message: 'page must be a positive integer.',
                      details: null,
                    },
                  },
                },
              },
            },
            '500': {
              description: 'GitHub upstream request or service failure.',
              content: {
                'application/json': {
                  example: {
                    error: {
                      code: 'UPSTREAM_ERROR',
                      message: 'GitHub API rate limit exceeded. Add GH_TOKEN with a GitHub personal access token to increase the request limit.',
                      details: null,
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/repos/{repoName}': {
        get: {
          tags: ['Default'],
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
              content: {
                'application/json': {
                  example: {
                    name: 'better-repos',
                    fullName: 'octocat/better-repos',
                    url: 'https://github.com/octocat/better-repos',
                    description: 'Example repository',
                  },
                },
              },
            },
            '404': {
              description: 'Repository not found.',
              content: {
                'application/json': {
                  example: {
                    error: {
                      code: 'NOT_FOUND',
                      message: 'Repository not found',
                      details: null,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export const openApiSpec = createOpenApiSpec();
