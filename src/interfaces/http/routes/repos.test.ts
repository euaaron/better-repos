import test from 'node:test';
import assert from 'node:assert/strict';

import { handleRepoRoute, handleReposRoute } from './repos';

const validEnv = {
  GH_USERNAME: 'octocat',
  APP_NAME: 'better-repos',
  APP_VERSION: '2.0.0',
  BUILD_COMMIT: 'abc123',
  BUILD_DATE: '2026-01-01T00:00:00.000Z',
  ALLOWED_ORIGINS: 'http://localhost:8787,http://127.0.0.1:8787',
  APP_ENV: 'development',
};

test('repos route returns all repositories when no pagination is requested', async () => {
  const service = {
    getAll: async () => [
      { name: 'alpha', url: 'https://github.com/octocat/alpha' },
      { name: 'beta', url: 'https://github.com/octocat/beta' },
    ],
  } as any;

  const response = await handleReposRoute(new Request('http://localhost:8787/repos'), validEnv, service);
  const payload = (await response.json()) as Array<{ name: string }>;

  assert.equal(response.status, 200);
  assert.equal(payload.length, 2);
  assert.equal(payload[0].name, 'alpha');
});

test('repos route paginates results correctly', async () => {
  const service = {
    getAll: async () => [
      { name: 'one', url: 'https://github.com/octocat/one' },
      { name: 'two', url: 'https://github.com/octocat/two' },
      { name: 'three', url: 'https://github.com/octocat/three' },
    ],
  } as any;

  const response = await handleReposRoute(
    new Request('http://localhost:8787/repos?page=1&page_size=2'),
    validEnv,
    service,
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    page: number;
    pageSize: number;
    totalRepositories: number;
    content: Array<{ name: string }>;
  };

  assert.equal(payload.page, 1);
  assert.equal(payload.pageSize, 2);
  assert.equal(payload.totalRepositories, 3);
  assert.equal(payload.content.length, 2);
});

test('repos route returns 400 for invalid pagination query values', async () => {
  const response = await handleReposRoute(
    new Request('http://localhost:8787/repos?page=0'),
    validEnv,
    { getAll: async () => [] } as any,
  );

  assert.equal(response.status, 400);
  const payload = (await response.json()) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'INVALID_QUERY');
  assert.equal(payload.error.message, 'page must be a positive integer.');
});

test('single repo route returns a matching project by name', async () => {
  const response = await handleRepoRoute(
    new Request('http://localhost:8787/repos/alpha'),
    validEnv,
    {
      getAll: async () => [
        { name: 'alpha', url: 'https://github.com/octocat/alpha' },
        { name: 'beta', url: 'https://github.com/octocat/beta' },
      ],
    } as any,
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { name: string; url: string };
  assert.equal(payload.name, 'alpha');
});

test('single repo route returns 404 when the project is missing', async () => {
  const response = await handleRepoRoute(
    new Request('http://localhost:8787/repos/missing'),
    validEnv,
    { getAll: async () => [{ name: 'alpha', url: 'https://github.com/octocat/alpha' }] } as any,
  );

  assert.equal(response.status, 404);
  const payload = (await response.json()) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'NOT_FOUND');
  assert.equal(payload.error.message, 'Repository not found');
});
