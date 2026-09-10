import { getGitHubToken, getGithubUsername, type Env } from './config';
import { ProjectService } from './application/ProjectService';
import { GitHubProjectRepository } from './infrastructure/GitHubProjectRepository';
import { handleRequest } from './interfaces/http/router';

function jsonErrorResponse(status: number, code: string, message: string, details: string | null = null): Response {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
        details,
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    },
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const username = getGithubUsername(env);
      const token = getGitHubToken(env);
      const service = new ProjectService(new GitHubProjectRepository(username, token));
      return await handleRequest(request, env, service);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected server error';
      return jsonErrorResponse(500, 'CONFIG_ERROR', message);
    }
  },
};
