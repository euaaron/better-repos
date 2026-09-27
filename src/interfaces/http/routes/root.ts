import { buildCorsHeaders } from '../cors';
import type { Env } from '../../../config';

export function renderRootPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Better Repos</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html { box-sizing: border-box; }
      *, *:before, *:after { box-sizing: inherit; }
      body { margin: 0; background: #f5f5f5; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
          persistAuthorization: true,
        });
      };
    </script>
  </body>
</html>`;
}

export function handleRootRoute(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin');

  return new Response(renderRootPage(), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...Object.fromEntries(buildCorsHeaders(origin, env).entries()),
    },
  });
}
