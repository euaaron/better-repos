import test from 'node:test';
import assert from 'node:assert/strict';

import { GitHubProjectRepository } from './GitHubProjectRepository';

test('GitHubProjectRepository maps upstream GitHub GraphQL data into domain objects', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url === 'https://api.github.com/graphql') {
      return new Response(
        JSON.stringify({
          data: {
            user: {
              repositories: {
                nodes: [
                  {
                    id: 'repo-1',
                    name: 'alpha',
                    nameWithOwner: 'octocat/alpha',
                    description: 'Alpha project',
                    url: 'https://github.com/octocat/alpha',
                    homepageUrl: null,
                    primaryLanguage: { name: 'TypeScript' },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    isFork: false,
                    owner: { login: 'octocat' },
                    repositoryTopics: { nodes: [{ topic: { name: 'api' } }, { topic: { name: 'typescript' } }] },
                    object: { text: '# Alpha' },
                  },
                ],
              },
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response('Not found', { status: 404 });
  };

  try {
    const repository = new GitHubProjectRepository('octocat', 'token-123');
    const projects = await repository.getProjects();

    assert.equal(projects.length, 1);
    assert.equal(projects[0].name, 'alpha');
    assert.equal(projects[0].fullName, 'octocat/alpha');
    assert.equal(projects[0].tags.includes('api'), true);
    assert.equal(projects[0].readme, '# Alpha');
    assert.equal(projects[0].language, 'TypeScript');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('GitHubProjectRepository fetches a single project README for the detail route', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url === 'https://api.github.com/graphql') {
      return new Response(
        JSON.stringify({
          data: {
            user: {
              repositories: {
                nodes: [
                  {
                    id: 'repo-1',
                    name: 'yees',
                    nameWithOwner: 'euaaron/yees',
                    description: 'Project',
                    url: 'https://github.com/euaaron/yees',
                    homepageUrl: null,
                    primaryLanguage: { name: 'TypeScript' },
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    isFork: false,
                    owner: { login: 'euaaron' },
                    repositoryTopics: { nodes: [{ topic: { name: 'react' } }] },
                    object: { text: 'none' },
                  },
                ],
              },
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url === 'https://api.github.com/repos/euaaron/yees/readme') {
      return new Response(
        JSON.stringify({
          content: Buffer.from('# Project README').toString('base64'),
          encoding: 'base64',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response('Not found', { status: 404 });
  };

  try {
    const repository = new GitHubProjectRepository('euaaron', 'token-123');
    const project = await repository.getProjectByName('yees');

    assert.ok(project);
    assert.equal(project?.fullName, 'euaaron/yees');
    assert.equal(project?.readme, '# Project README');
    assert.deepEqual(project?.tags, ['react']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('GitHubProjectRepository surfaces a clear rate limit error when GitHub rejects the request', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        errors: [{ message: 'API rate limit exceeded' }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  try {
    const repository = new GitHubProjectRepository('octocat', 'token-123');
    await assert.rejects(() => repository.getProjects(), {
      message: /API rate limit exceeded/i,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
