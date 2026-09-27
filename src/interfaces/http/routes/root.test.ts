import test from 'node:test';
import assert from 'node:assert/strict';

import { handleRootRoute } from './root';

const validEnv = {
  GH_USERNAME: 'octocat',
  APP_NAME: 'better-repos',
  APP_VERSION: '2.0.0',
  BUILD_COMMIT: 'abc123',
  BUILD_DATE: '2026-01-01T00:00:00.000Z',
  ALLOWED_ORIGINS: 'http://localhost:8787,http://127.0.0.1:8787',
  APP_ENV: 'development',
};

test('root route serves the Swagger UI page', () => {
  const response = handleRootRoute(new Request('http://localhost:8787/'), validEnv);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/i);
  const body = response.text();
  assert.ok(body instanceof Promise);
});
