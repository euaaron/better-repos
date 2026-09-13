import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..', '..');

const packageJson = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

const shouldWriteEnvFile = process.argv.includes('--write');

// The generated file only contains build metadata and non-sensitive runtime defaults.
// Deployment secrets are supplied only at deploy time and should not block local or CI validation runs.

const getGitCommand = (command) => {
  try {
    return execSync(command, { cwd: projectRoot, encoding: 'utf8' }).trim();
  } catch {
    throw new Error(`Failed to resolve git metadata for: ${command}`);
  }
};

const formatGeneratedAt = (date = new Date()) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} - ${hours}:${minutes}`;
};

const appName = process.env.APP_NAME?.trim() || packageJson.name;
const appVersion = process.env.APP_VERSION?.trim() || packageJson.version;
const buildCommit = process.env.BUILD_COMMIT?.trim() || getGitCommand('git rev-parse HEAD');
const buildDate = process.env.BUILD_DATE?.trim() || getGitCommand('git log -1 --format=%cI');
const appEnv = process.env.APP_ENV?.trim() || 'development';
const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.trim() || 'http://localhost:8787,http://127.0.0.1:8787';
const githubUsername = process.env.GH_USERNAME?.trim() || '';

const output = [
  `APP_NAME=${appName}`,
  `APP_VERSION=${appVersion}`,
  `BUILD_COMMIT=${buildCommit}`,
  `BUILD_DATE=${buildDate}`,
  `APP_ENV=${appEnv}`,
  `ALLOWED_ORIGINS=${allowedOrigins}`,
].join('\n');

const environmentFile = `// This file was generated automatically at ${formatGeneratedAt()}\nexport const env = {\n  APP_NAME: ${JSON.stringify(appName)},\n  APP_VERSION: ${JSON.stringify(appVersion)},\n  BUILD_COMMIT: ${JSON.stringify(buildCommit)},\n  BUILD_DATE: ${JSON.stringify(buildDate)},\n  APP_ENV: ${JSON.stringify(appEnv)},\n  ALLOWED_ORIGINS: ${JSON.stringify(allowedOrigins)},\n  GH_USERNAME: ${JSON.stringify(githubUsername)},\n} as const;\n\nexport default env;\n`;

if (shouldWriteEnvFile) {
  writeFileSync(path.join(projectRoot, 'src', 'env.ts'), environmentFile, 'utf8');
  process.stdout.write(environmentFile);
  process.exit(0);
}

process.stdout.write(`${output}\n`);
