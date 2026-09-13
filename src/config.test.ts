import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAllowedOrigins,
  getAppEnvironment,
  getAppName,
  getAppVersion,
  getBuildCommit,
  getBuildDate,
  getGitHubToken,
  getGithubUsername,
} from './config';

test('getGithubUsername returns the configured username', () => {
  const username = getGithubUsername({ GH_USERNAME: ' octocat ' });
  assert.equal(username, 'octocat');
});

test('getGithubUsername throws when the username is missing', () => {
  assert.throws(
    () => getGithubUsername({}),
    /GH_USERNAME is required/i,
  );
});

test('getGitHubToken returns undefined for an empty token value', () => {
  assert.equal(getGitHubToken({ GH_TOKEN: '   ' }), undefined);
  assert.equal(getGitHubToken({ GH_TOKEN: 'token-123' }), 'token-123');
});

test('getAllowedOrigins returns localhost defaults when not configured', () => {
  assert.deepEqual(getAllowedOrigins({}), [
    'http://localhost:8787',
    'http://127.0.0.1:8787',
  ]);
});

test('getAllowedOrigins parses comma separated origins', () => {
  assert.deepEqual(getAllowedOrigins({ ALLOWED_ORIGINS: 'https://a.example.com, https://b.example.com, ' }), [
    'https://a.example.com',
    'https://b.example.com',
  ]);
});

test('getAppName and app metadata accessors use package defaults when env values are absent', () => {
  const env = {
    APP_NAME: 'better-repos',
    APP_VERSION: '2.0.0',
    BUILD_COMMIT: 'abc123',
    BUILD_DATE: '2026-09-10T00:00:00.000Z',
    APP_ENV: 'production',
  };

  assert.equal(getAppName(env), 'better-repos');
  assert.equal(getAppVersion(env), '2.0.0');
  assert.equal(getBuildCommit(env), 'abc123');
  assert.equal(getBuildDate(env), '2026-09-10T00:00:00.000Z');
  assert.equal(getAppEnvironment(env), 'production');
  assert.equal(getAppEnvironment({}), 'development');
  assert.equal(getAppName({}), 'better-repos');
  assert.equal(getAppVersion({}), '2.0.0');
  assert.match(getBuildCommit({}), /^([a-f0-9]{7,40}|unknown)$/i);
  assert.match(getBuildDate({}), /^\d{4}-\d{2}-\d{2}T/);
});
