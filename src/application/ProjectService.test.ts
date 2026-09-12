import test from 'node:test';
import assert from 'node:assert/strict';

import { ProjectService } from './ProjectService';
import type { Project } from '../domain/project';

function buildProjects(): Project[] {
  return [
    {
      origin: 'github',
      owner: 'octocat',
      name: 'alpha',
      fullName: 'octocat/alpha',
      description: 'Alpha project',
      url: 'https://github.com/octocat/alpha',
      homepage: null,
      language: 'typescript',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      readme: '# alpha',
      tags: ['api', 'typescript'],
    },
    {
      origin: 'github',
      owner: 'octocat',
      name: 'beta',
      fullName: 'octocat/beta',
      description: 'Beta project',
      url: 'https://github.com/octocat/beta',
      homepage: null,
      language: 'typescript',
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: '2025-02-01T00:00:00.000Z',
      readme: '# beta',
      tags: ['api', 'database'],
    },
    {
      origin: 'github',
      owner: 'octocat',
      name: 'gamma',
      fullName: 'octocat/gamma',
      description: 'Gamma project',
      url: 'https://github.com/octocat/gamma',
      homepage: null,
      language: 'python',
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2025-03-01T00:00:00.000Z',
      readme: '# gamma',
      tags: ['python'],
    },
  ];
}

test('ProjectService caches repository data between calls', async () => {
  let callCount = 0;
  const repository = {
    getProjects: async () => {
      callCount += 1;
      return buildProjects();
    },
  } as any;

  const service = new ProjectService(repository, 60_000);

  const firstResult = await service.getAll();
  const secondResult = await service.getAll();

  assert.equal(callCount, 1);
  assert.deepEqual(firstResult, secondResult);
});

test('ProjectService returns a matching repository by name or URL fragment', async () => {
  const repository = {
    getProjects: async () => buildProjects(),
  } as any;

  const service = new ProjectService(repository, 60_000);

  const byExactName = await service.getByName('beta');
  const byUrlFragment = await service.getByName('octocat/alpha');
  const byEmptyName = await service.getByName('   ');

  assert.equal(byExactName?.name, 'beta');
  assert.equal(byUrlFragment?.name, 'alpha');
  assert.equal(byEmptyName, null);
});

test('ProjectService enriches related projects with matching tags and languages', async () => {
  const repository = {
    getProjects: async () => buildProjects(),
  } as any;

  const service = new ProjectService(repository, 60_000);
  const projects = await service.getAll();

  const alpha = projects.find((project) => project.name === 'alpha');
  assert.ok(alpha);
  assert.ok(alpha?.similarTo?.some((item) => item.name === 'beta'));
  assert.ok(alpha?.similarTo?.some((item) => item.name === 'beta' && ['api', 'typescript'].includes(item.reason)));
});

test('ProjectService ranks similar projects by shared tags, then name similarity, then language', async () => {
  const projects = [
    {
      origin: 'github',
      owner: 'octocat',
      name: 'gobarber',
      fullName: 'octocat/gobarber',
      description: 'Gobarber',
      url: 'https://github.com/octocat/gobarber',
      homepage: null,
      language: 'typescript',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      readme: '# gobarber',
      tags: ['api', 'node', 'postgres'],
    },
    {
      origin: 'github',
      owner: 'octocat',
      name: 'gobarber-api',
      fullName: 'octocat/gobarber-api',
      description: 'API',
      url: 'https://github.com/octocat/gobarber-api',
      homepage: null,
      language: 'typescript',
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: '2025-02-01T00:00:00.000Z',
      readme: '# gobarber-api',
      tags: ['api', 'node'],
    },
    {
      origin: 'github',
      owner: 'octocat',
      name: 'gobarber-app',
      fullName: 'octocat/gobarber-app',
      description: 'App',
      url: 'https://github.com/octocat/gobarber-app',
      homepage: null,
      language: 'react',
      createdAt: '2024-02-01T00:00:00.000Z',
      updatedAt: '2025-02-01T00:00:00.000Z',
      readme: '# gobarber-app',
      tags: ['react'],
    },
    {
      origin: 'github',
      owner: 'octocat',
      name: 'api-tools',
      fullName: 'octocat/api-tools',
      description: 'Tools',
      url: 'https://github.com/octocat/api-tools',
      homepage: null,
      language: 'java',
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2025-03-01T00:00:00.000Z',
      readme: '# api-tools',
      tags: ['api'],
    },
    {
      origin: 'github',
      owner: 'octocat',
      name: 'portfolio',
      fullName: 'octocat/portfolio',
      description: 'Portfolio',
      url: 'https://github.com/octocat/portfolio',
      homepage: null,
      language: 'typescript',
      createdAt: '2024-04-01T00:00:00.000Z',
      updatedAt: '2025-04-01T00:00:00.000Z',
      readme: '# portfolio',
      tags: ['design'],
    },
  ] as any;

  const service = new ProjectService({ getProjects: async () => projects } as any, 60_000);
  const result = await service.getAll();
  const gobarber = result.find((project) => project.name === 'gobarber');

  assert.ok(gobarber);
  assert.deepEqual(
    gobarber?.similarTo?.map((item) => item.name),
    ['gobarber-api', 'gobarber-app', 'api-tools', 'portfolio'],
  );
});
