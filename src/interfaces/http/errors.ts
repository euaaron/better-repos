export function jsonErrorResponse(status: number, code: string, message: string, details: string | null = null): Response {
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
