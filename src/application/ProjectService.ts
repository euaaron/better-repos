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
    const scoredProjects = projects
      .filter((item) => item.name !== project.name)
      .map((item) => ({
        item,
        score: this.getSimilarityScore(project, item),
        reason: this.getSimilarityReason(project, item),
      }))
      .filter((entry) => entry.reason !== null)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        if (left.item.name.startsWith(project.name) !== right.item.name.startsWith(project.name)) {
          return left.item.name.startsWith(project.name) ? -1 : 1;
        }

        return left.item.name.localeCompare(right.item.name);
      })
      .map(({ item, reason }) => ({
        name: item.name,
        reason: reason ?? item.language ?? 'related',
        url: item.url,
      }));

    return scoredProjects;
  }

  private getSimilarityScore(project: Project, item: Project): number {
    let score = 0;

    const sharedTags = project.tags?.filter((tag) => item.tags?.includes(tag)) ?? [];
    score += sharedTags.length * 10;

    const nameSimilarity = this.getNameSimilarityScore(project.name, item.name);
    score += nameSimilarity;

    if (project.language && item.language && project.language === item.language) {
      score += 1;
    }

    return score;
  }

  private getSimilarityReason(project: Project, item: Project): string | null {
    const sharedTags = project.tags?.filter((tag) => item.tags?.includes(tag)) ?? [];
    if (sharedTags.length > 0) {
      return sharedTags[0];
    }

    const nameSimilarity = this.getNameSimilarityScore(project.name, item.name);
    if (nameSimilarity > 0) {
      return item.name;
    }

    if (project.language && item.language && project.language === item.language) {
      return item.language;
    }

    if (item.tags?.length && project.language) {
      const tagMatch = this.findMatchingTag(item.tags, [project.language]);
      if (tagMatch) {
        return tagMatch;
      }
    }

    if (project.tags?.length && item.language) {
      const tagMatch = this.findMatchingTag(project.tags, [item.language]);
      if (tagMatch) {
        return tagMatch;
      }
    }

    return null;
  }

  private getNameSimilarityScore(leftName: string, rightName: string): number {
    const normalizedLeft = leftName.toLowerCase();
    const normalizedRight = rightName.toLowerCase();

    if (normalizedLeft === normalizedRight) {
      return 100;
    }

    if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) {
      return 90;
    }

    const leftParts = normalizedLeft.split(/[-_\s]+/);
    const rightParts = normalizedRight.split(/[-_\s]+/);
    const commonParts = leftParts.filter((part) => rightParts.includes(part));

    return commonParts.length * 25;
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
