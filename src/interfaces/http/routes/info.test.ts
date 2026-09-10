import test from 'node:test';
import assert from 'node:assert/strict';

import { handleInfoRoute } from './info';

const validEnv = {
  GITHUB_USERNAME: 'octocat',
  APP_NAME: 'better-repos',
  APP_VERSION: '2.0.0',
  BUILD_COMMIT: 'abc123',
  BUILD_DATE: '2026-01-01T00:00:00.000Z',
  ALLOWED_ORIGINS: 'http://localhost:8787,http://127.0.0.1:8787',
  APP_ENV: 'development',
};

test('info route returns application metadata', async () => {
  const response = handleInfoRoute(new Request('http://localhost:8787/info'), validEnv);

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    name: string;
    version: string;
    environment: string;
    build: { commit: string; date: string };
  };

  assert.equal(payload.name, 'better-repos');
  assert.equal(payload.version, '2.0.0');
  assert.equal(payload.environment, 'development');
  assert.equal(payload.build.commit, 'abc123');
});

test('info route returns config error if required metadata is missing', async () => {
  const response = handleInfoRoute(new Request('http://localhost:8787/info'), {});

  assert.equal(response.status, 500);
  const payload = (await response.json()) as { error: { code: string; message: string } };
  assert.equal(payload.error.code, 'CONFIG_ERROR');
  assert.match(payload.error.message, /APP_NAME is required/i);
});
