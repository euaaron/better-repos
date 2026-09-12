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
  const rawValue = env.ALLOWED_ORIGINS?.trim();

  if (!rawValue) {
    return ['http://localhost:8787', 'http://127.0.0.1:8787'];
  }

  return rawValue
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function getAppName(env: Env): string {
  const appName = env.APP_NAME?.trim();

  if (!appName) {
    throw new Error('APP_NAME is required. Set it in your environment or GitHub Actions variables.');
  }

  return appName;
}

export function getAppVersion(env: Env): string {
  const appVersion = env.APP_VERSION?.trim();

  if (!appVersion) {
    throw new Error('APP_VERSION is required. Set it in your environment or GitHub Actions variables.');
  }

  return appVersion;
}

export function getBuildCommit(env: Env): string {
  const buildCommit = env.BUILD_COMMIT?.trim();

  if (!buildCommit) {
    throw new Error('BUILD_COMMIT is required. Set it in your environment or GitHub Actions variables.');
  }

  return buildCommit;
}

export function getBuildDate(env: Env): string {
  const buildDate = env.BUILD_DATE?.trim();

  if (!buildDate) {
    throw new Error('BUILD_DATE is required. Set it in your environment or GitHub Actions variables.');
  }

  return buildDate;
}

export function getAppEnvironment(env: Env): string {
  return env.APP_ENV?.trim() || 'development';
}
