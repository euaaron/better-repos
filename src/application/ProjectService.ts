import type { Project, SimilarProject } from '../domain/project';
import { GitHubProjectRepository } from '../infrastructure/GitHubProjectRepository';

export class ProjectService {
  private cache: Promise<Project[]> | null = null;
  private cacheTimestamp = 0;

  constructor(
    private readonly repository: GitHubProjectRepository,
    private readonly cacheTtlMs = 5 * 60 * 1000,
  ) {}

  async getAll(): Promise<Project[]> {
    if (this.cache && Date.now() - this.cacheTimestamp < this.cacheTtlMs) {
      return this.cache;
    }

    this.cache = this.repository.getProjects().then((projects) => this.enrichSimilarProjects(projects));
    this.cacheTimestamp = Date.now();
    return this.cache;
  }

  async getByName(name: string): Promise<Project | null> {
    const normalizedName = name.trim().toLowerCase();
    if (!normalizedName) {
      return null;
    }

    const repositoryMethod = this.repository.getProjectByName?.bind(this.repository);
    const directProject = repositoryMethod ? await repositoryMethod(normalizedName) : null;

    if (directProject) {
      const projects = await this.getAll();
      const similarTo = this.findSimilarProjects(directProject, projects);
      return { ...directProject, similarTo };
    }

    const projects = await this.getAll();
    return (
      projects.find(
        (item) =>
          item.name.toLowerCase() === normalizedName ||
          item.fullName.toLowerCase().includes(normalizedName) ||
          item.url.toLowerCase().includes(normalizedName),
      ) ?? null
    );
  }

  private enrichSimilarProjects(projects: Project[]): Project[] {
    return projects.map((project) => ({
      ...project,
      similarTo: this.findSimilarProjects(project, projects),
    }));
  }

  private findSimilarProjects(project: Project, projects: Project[]): SimilarProject[] {
    const similarProjects: SimilarProject[] = [];

    for (const item of projects) {
      if (item.name === project.name) {
        continue;
      }

      if (item.tags && project.tags) {
        const match = this.findMatchingTag(item.tags, project.tags);
        if (match) {
          similarProjects.push({ name: item.name, reason: match, url: item.url });
          continue;
        }
      }

      if (item.language && item.language === project.language) {
        similarProjects.push({ name: item.name, reason: item.language, url: item.url });
        continue;
      }

      if (item.tags?.length && project.language) {
        const tagMatch = this.findMatchingTag(item.tags, [project.language]);
        if (tagMatch) {
          similarProjects.push({ name: item.name, reason: tagMatch, url: item.url });
          continue;
        }
      }

      if (project.tags?.length && item.language) {
        const tagMatch = this.findMatchingTag(project.tags, [item.language]);
        if (tagMatch) {
          similarProjects.push({ name: item.name, reason: tagMatch, url: item.url });
        }
      }
    }

    return similarProjects;
  }

  private findMatchingTag(sourceTags: string[], compareTags: string[]): string | null {
    for (const tag of sourceTags) {
      if (compareTags.includes(tag)) {
        return tag;
      }
    }

    return null;
  }
}
