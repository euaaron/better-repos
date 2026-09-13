import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const minimumCoverage = 70;
const testProcess = spawnSync('npm', ['run', 'test:coverage'], {
  encoding: 'utf8',
});

process.stdout.write(testProcess.stdout ?? '');
process.stderr.write(testProcess.stderr ?? '');

if (testProcess.status !== 0) {
  process.exit(testProcess.status ?? 1);
}

const coverageOutput = `${testProcess.stdout ?? ''}\n${testProcess.stderr ?? ''}`;
const coverageMatch = coverageOutput.match(/all files\s+\|\s+([\d.]+)/i);
const coverage = coverageMatch ? Number(coverageMatch[1]) : Number.NaN;

if (!Number.isFinite(coverage)) {
  console.error('Could not find the aggregate line coverage in the test output.');
  process.exit(1);
}

if (coverage < minimumCoverage) {
  console.error(`Line coverage is ${coverage}%, below the required ${minimumCoverage}%.`);
  process.exit(1);
}

const coverageBadgeFile = process.env.COVERAGE_BADGE_FILE;
if (coverageBadgeFile) {
  const color = coverage >= 90 ? 'brightgreen' : coverage >= minimumCoverage ? 'yellow' : 'red';
  writeFileSync(
    coverageBadgeFile,
    `${JSON.stringify({ schemaVersion: 1, label: 'coverage', message: `${coverage}%`, color })}\n`,
    'utf8',
  );
}

console.log(`Line coverage is ${coverage}%, meeting the required ${minimumCoverage}%.`);