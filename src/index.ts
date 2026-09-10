import { getGitHubToken, getGithubUsername, type Env } from './config';
import { ProjectService } from './application/ProjectService';
import { GitHubProjectRepository } from './infrastructure/GitHubProjectRepository';
import { handleRequest } from './interfaces/http/router';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const username = getGithubUsername(env);
    const token = getGitHubToken(env);
    const service = new ProjectService(new GitHubProjectRepository(username, token));
    return handleRequest(request, env, service);
  },
};
