export type Env = {
  GITHUB_USERNAME?: string;
  GITHUB_TOKEN?: string;
  ALLOWED_ORIGINS?: string;
};

export function getGithubUsername(env: Env): string {
  return env.GITHUB_USERNAME?.trim() || 'euaaron';
}

export function getGitHubToken(env: Env): string | undefined {
  const token = env.GITHUB_TOKEN?.trim();
  return token && token.length > 0 ? token : undefined;
}

export function getAllowedOrigins(env: Env): string[] {
  const rawValue = env.ALLOWED_ORIGINS ?? 'http://localhost:8787,https://aaroncarneiro.com';

  return rawValue
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
