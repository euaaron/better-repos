import test from 'node:test';
import assert from 'node:assert/strict';

import { handleHealthRoute } from './health';

const validEnv = {
  GITHUB_USERNAME: 'octocat',
  APP_NAME: 'better-repos',
  APP_VERSION: '2.0.0',
  BUILD_COMMIT: 'abc123',
  BUILD_DATE: '2026-01-01T00:00:00.000Z',
  ALLOWED_ORIGINS: 'http://localhost:8787,http://127.0.0.1:8787',
  APP_ENV: 'development',
};

test('health route returns JSON status and timestamp', async () => {
  const response = handleHealthRoute(new Request('http://localhost:8787/health'), validEnv);

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { status: string; timestamp: string };
  assert.equal(payload.status, 'ok');
  assert.ok(typeof payload.timestamp === 'string');
});
