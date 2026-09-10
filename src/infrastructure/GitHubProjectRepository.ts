import type { Project } from '../domain/project';

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  created_at: string;
  updated_at: string;
  fork: boolean;
  owner: {
    login: string;
  };
};

export class GitHubProjectRepository {
  constructor(
    private readonly username: string,
    private readonly token?: string,
  ) {}

  async getProjects(): Promise<Project[]> {
    const repositories = await this.fetchRepositories();

    const projects = await Promise.all(
      repositories.map(async (repository) => {
        const tags = await this.fetchTopics(repository.owner.login, repository.name);
        const readme = await this.fetchReadme(repository.owner.login, repository.name);

        return {
          origin: 'github',
          owner: repository.owner.login,
          name: repository.name,
          fullName: repository.full_name,
          description: repository.description,
          url: repository.html_url,
          homepage: repository.homepage,
          language: repository.language === 'css' ? 'css3' : repository.language,
          createdAt: this.formatDate(repository.created_at),
          updatedAt: this.formatDate(repository.updated_at),
          readme,
          tags,
        } satisfies Project;
      }),
    );

    return projects.sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  }

  private async fetchRepositories(): Promise<GitHubRepository[]> {
    const response = await fetch(`https://api.github.com/users/${this.username}/repos`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 403
          ? 'GitHub API rate limit exceeded. Add GITHUB_TOKEN with a GitHub personal access token to increase the request limit.'
          : `GitHub request failed with status ${response.status}`,
      );
    }

    const repositories = (await response.json()) as GitHubRepository[];
    return repositories.filter((repository) => !repository.fork);
  }

  private async fetchTopics(owner: string, repo: string): Promise<string[]> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/topics`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { names?: string[] };
    return [...new Set(payload.names ?? [])];
  }

  private async fetchReadme(owner: string, repo: string): Promise<string> {
    const readmeUrls = [
      `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`,
      `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`,
    ];

    for (const url of readmeUrls) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BetterReposWorker',
        },
      });
      if (response.ok) {
        return await response.text();
      }
    }

    return 'none';
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
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
