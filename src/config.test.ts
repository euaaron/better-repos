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
  const username = getGithubUsername({ GITHUB_USERNAME: ' octocat ' });
  assert.equal(username, 'octocat');
});

test('getGithubUsername throws when the username is missing', () => {
  assert.throws(
    () => getGithubUsername({}),
    /GITHUB_USERNAME is required/i,
  );
});

test('getGitHubToken returns undefined for an empty token value', () => {
  assert.equal(getGitHubToken({ GITHUB_TOKEN: '   ' }), undefined);
  assert.equal(getGitHubToken({ GITHUB_TOKEN: 'token-123' }), 'token-123');
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

test('getAppName and app metadata accessors validate required values', () => {
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
});

test('metadata getters throw when a required variable is missing', () => {
  assert.throws(() => getAppName({}), /APP_NAME is required/i);
  assert.throws(() => getAppVersion({}), /APP_VERSION is required/i);
  assert.throws(() => getBuildCommit({}), /BUILD_COMMIT is required/i);
  assert.throws(() => getBuildDate({}), /BUILD_DATE is required/i);
});
