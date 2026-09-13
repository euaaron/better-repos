import type { Env } from './config';
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
      return await handleRequest(request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected server error';
      return jsonErrorResponse(500, 'CONFIG_ERROR', message);
    }
  },
};
