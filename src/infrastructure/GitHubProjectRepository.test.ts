import test from 'node:test';
import assert from 'node:assert/strict';

import { GitHubProjectRepository } from './GitHubProjectRepository';

test('GitHubProjectRepository maps upstream repo data into domain objects', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.startsWith('https://api.github.com/users/octocat/repos')) {
      return new Response(
        JSON.stringify([
          {
            id: 1,
            name: 'alpha',
            full_name: 'octocat/alpha',
            description: 'Alpha project',
            html_url: 'https://github.com/octocat/alpha',
            homepage: null,
            language: 'TypeScript',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            fork: false,
            owner: { login: 'octocat' },
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.includes('/topics')) {
      return new Response(JSON.stringify({ names: ['api', 'typescript'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('/README.md')) {
      return new Response('# Alpha', { status: 200, headers: { 'Content-Type': 'text/plain' } });
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

test('GitHubProjectRepository surfaces a clear rate limit error when GitHub rejects the request', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('rate limited', { status: 403 });

  try {
    const repository = new GitHubProjectRepository('octocat', 'token-123');
    await assert.rejects(() => repository.getProjects(), {
      message: /GitHub API rate limit exceeded/i,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
