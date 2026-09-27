import packageJson from '../package.json' with { type: 'json' };
import generatedEnv from './env';

export type Env = {
  GH_USERNAME?: string;
  GH_TOKEN?: string;
  ALLOWED_ORIGINS?: string;
  APP_NAME?: string;
  APP_VERSION?: string;
  BUILD_COMMIT?: string;
  BUILD_DATE?: string;
  APP_ENV?: string;
};

const DEFAULT_APP_NAME = (generatedEnv.APP_NAME || packageJson.name || 'better-repos').trim();
const DEFAULT_APP_VERSION = (generatedEnv.APP_VERSION || packageJson.version || '0.0.0').trim();
const DEFAULT_BUILD_COMMIT = (generatedEnv.BUILD_COMMIT || 'unknown').trim();
const DEFAULT_BUILD_DATE = (generatedEnv.BUILD_DATE || new Date(0).toISOString()).trim();
const DEFAULT_ALLOWED_ORIGINS = generatedEnv.ALLOWED_ORIGINS || 'http://localhost:8787,http://127.0.0.1:8787';

export function getGithubUsername(env: Env): string {
  const username = env.GH_USERNAME?.trim();

  if (!username) {
    throw new Error('GH_USERNAME is required. Set it in your environment or GitHub Actions secrets.');
  }

  return username;
}

export function getGitHubToken(env: Env): string | undefined {
  const token = env.GH_TOKEN?.trim();
  return token && token.length > 0 ? token : undefined;
}

export function getAllowedOrigins(env: Env): string[] {
  const rawValue = env.ALLOWED_ORIGINS?.trim() || generatedEnv.ALLOWED_ORIGINS?.trim() || DEFAULT_ALLOWED_ORIGINS;

  return rawValue
    .split(',')
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0);
}

export function getAppName(env: Env): string {
  return env.APP_NAME?.trim() || generatedEnv.APP_NAME?.trim() || DEFAULT_APP_NAME;
}

export function getAppVersion(env: Env): string {
  return env.APP_VERSION?.trim() || generatedEnv.APP_VERSION?.trim() || DEFAULT_APP_VERSION;
}

export function getBuildCommit(env: Env): string {
  return env.BUILD_COMMIT?.trim() || generatedEnv.BUILD_COMMIT?.trim() || DEFAULT_BUILD_COMMIT;
}

export function getBuildDate(env: Env): string {
  return env.BUILD_DATE?.trim() || generatedEnv.BUILD_DATE?.trim() || DEFAULT_BUILD_DATE;
}

export function getAppEnvironment(env: Env): string {
  return env.APP_ENV?.trim() || generatedEnv.APP_ENV?.trim() || 'development';
}
