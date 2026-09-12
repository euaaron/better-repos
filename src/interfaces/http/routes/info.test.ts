import test from 'node:test';
import assert from 'node:assert/strict';

import { handleInfoRoute } from './info';

const validEnv = {
  GH_USERNAME: 'octocat',
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

test('info route falls back to package metadata when build env vars are missing', async () => {
  const response = handleInfoRoute(new Request('http://localhost:8787/info'), {});

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    name: string;
    version: string;
    build: { commit: string; date: string };
  };

  assert.equal(payload.name, 'better-repos');
  assert.equal(payload.version, '2.0.0');
  assert.equal(payload.build.commit, 'unknown');
  assert.match(payload.build.date, /^\d{4}-\d{2}-\d{2}T/);
});
