import type { Project } from '../domain/project';

type GraphQlRepositoryNode = {
  id: string;
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  primaryLanguage: { name: string | null } | null;
  createdAt: string;
  updatedAt: string;
  isFork: boolean;
  owner: {
    login: string;
  };
  repositoryTopics: {
    nodes: Array<{
      topic: { name: string };
    }>;
  };
  object?: {
    text?: string;
  } | null;
};

type GraphQlResponse = {
  data?: {
    user?: {
      repositories?: {
        nodes?: GraphQlRepositoryNode[];
      };
    };
  };
  errors?: Array<{ message?: string }>;
};

export class GitHubProjectRepository {
  private readonly cacheTtlMs = 5 * 60 * 1000;
  private cache: Promise<Project[]> | null = null;
  private cacheTimestamp = 0;

  constructor(
    private readonly username: string,
    private readonly token?: string,
  ) {}

  async getProjects(): Promise<Project[]> {
    const now = Date.now();

    if (this.cache && now - this.cacheTimestamp < this.cacheTtlMs) {
      return this.cache;
    }

    this.cache = this.fetchProjectsFromGitHub();
    this.cacheTimestamp = now;

    return this.cache;
  }

  async getProjectByName(name: string): Promise<Project | null> {
    const normalizedName = name.trim().toLowerCase();
    if (!normalizedName) {
      return null;
    }

    const repositories = await this.fetchRepositories();
    const repository = repositories.find(
      (item) =>
        item.name.toLowerCase() === normalizedName ||
        item.nameWithOwner.toLowerCase().includes(normalizedName) ||
        item.url.toLowerCase().includes(normalizedName),
    );

    if (!repository) {
      return null;
    }

    const readme = await this.fetchReadme(repository.owner.login, repository.name);
    return {
      origin: 'github',
      owner: repository.owner.login,
      name: repository.name,
      fullName: repository.nameWithOwner,
      description: repository.description,
      url: repository.url,
      homepage: repository.homepageUrl,
      language: repository.primaryLanguage?.name === 'CSS' ? 'css3' : repository.primaryLanguage?.name ?? null,
      createdAt: this.formatDate(repository.createdAt),
      updatedAt: this.formatDate(repository.updatedAt),
      readme,
      tags: [...new Set(repository.repositoryTopics.nodes.map((item) => item.topic.name))],
    } satisfies Project;
  }

  private async fetchProjectsFromGitHub(): Promise<Project[]> {
    const repositories = await this.fetchRepositories();

    return repositories
      .map((repository): Project => ({
        origin: 'github',
        owner: repository.owner.login,
        name: repository.name,
        fullName: repository.nameWithOwner,
        description: repository.description,
        url: repository.url,
        homepage: repository.homepageUrl,
        language: repository.primaryLanguage?.name === 'CSS' ? 'css3' : repository.primaryLanguage?.name ?? null,
        createdAt: this.formatDate(repository.createdAt),
        updatedAt: this.formatDate(repository.updatedAt),
        readme: repository.object?.text ?? 'none',
        tags: [...new Set(repository.repositoryTopics.nodes.map((item) => item.topic.name))],
      }))
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }

  private async fetchRepositories(): Promise<GraphQlRepositoryNode[]> {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        query: `
          query($login: String!) {
            user(login: $login) {
              repositories(ownerAffiliations: OWNER, first: 100, privacy: PUBLIC, isFork: false, orderBy: {field: UPDATED_AT, direction: DESC}) {
                nodes {
                  id
                  name
                  nameWithOwner
                  description
                  url
                  homepageUrl
                  primaryLanguage { name }
                  createdAt
                  updatedAt
                  isFork
                  owner { login }
                  repositoryTopics(first: 20) {
                    nodes { topic { name } }
                  }
                  object(expression: "HEAD:") {
                    ... on Blob {
                      text
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { login: this.username },
      }),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 403
          ? 'GitHub API rate limit exceeded. Add GH_TOKEN with a GitHub personal access token to increase the request limit.'
          : `GitHub request failed with status ${response.status}`,
      );
    }

    const payload = (await response.json()) as GraphQlResponse;

    if (payload.errors?.length) {
      throw new Error(payload.errors[0]?.message ?? 'GitHub GraphQL request failed');
    }

    const repositories = payload.data?.user?.repositories?.nodes ?? [];
    return repositories.filter((repository) => !repository.isFork);
  }

  private async fetchReadme(owner: string, repo: string): Promise<string> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return 'none';
    }

    const payload = (await response.json()) as { content?: string; encoding?: string };
    if (!payload.content || payload.encoding !== 'base64') {
      return 'none';
    }

    const binary = atob(payload.content.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'BetterReposWorker',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private formatDate(date: string): string {
    return new Date(date).toISOString();
  }
}
