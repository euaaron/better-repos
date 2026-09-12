import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..', '..');

const packageJson = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));

const requiredEnv = ['GH_USERNAME', 'GH_TOKEN', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'];

for (const key of requiredEnv) {
  if (!process.env[key] || !process.env[key].trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const getGitCommand = (command) => {
  try {
    return execSync(command, { cwd: projectRoot, encoding: 'utf8' }).trim();
  } catch {
    throw new Error(`Failed to resolve git metadata for: ${command}`);
  }
};

const appName = process.env.APP_NAME?.trim() || packageJson.name;
const appVersion = process.env.APP_VERSION?.trim() || packageJson.version;
const buildCommit = process.env.BUILD_COMMIT?.trim() || getGitCommand('git rev-parse HEAD');
const buildDate = process.env.BUILD_DATE?.trim() || getGitCommand('git log -1 --format=%cI');
const appEnv = process.env.APP_ENV?.trim() || 'development';
const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.trim() || 'http://localhost:8787,http://127.0.0.1:8787';

const output = [
  `APP_NAME=${appName}`,
  `APP_VERSION=${appVersion}`,
  `BUILD_COMMIT=${buildCommit}`,
  `BUILD_DATE=${buildDate}`,
  `APP_ENV=${appEnv}`,
  `ALLOWED_ORIGINS=${allowedOrigins}`,
].join('\n');

process.stdout.write(`${output}\n`);
