import test from 'node:test';
import assert from 'node:assert/strict';

import worker from './index';

test('root route serves the Swagger UI even when GitHub env vars are absent', async () => {
  const response = await worker.fetch(new Request('http://localhost:8787/'), {});

  assert.equal(response.status, 200);
  assert.match(await response.text(), /SwaggerUIBundle|swagger-ui/i);
});
