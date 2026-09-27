import {
  getAppEnvironment,
  getAppName,
  getAppVersion,
  getBuildCommit,
  getBuildDate,
  type Env,
} from '../../../config';
import { buildJsonHeaders } from '../cors';
import { jsonErrorResponse } from '../errors';

export function handleInfoRoute(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin');

  try {
    const info = {
      name: getAppName(env),
      version: getAppVersion(env),
      build: {
        commit: getBuildCommit(env),
        date: getBuildDate(env),
      },
      environment: getAppEnvironment(env),
    };

    return new Response(JSON.stringify(info), {
      status: 200,
      headers: buildJsonHeaders(origin, env),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    return jsonErrorResponse(500, 'CONFIG_ERROR', message);
  }
}
