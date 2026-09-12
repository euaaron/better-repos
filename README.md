# **Better** Repos

**Better** `Repos` is a Cloudflare Worker that exposes a GitHub profile's public repositories in a clean, portfolio-friendly API format.

It gathers repository metadata such as name, description, homepage, language, README content, tags, and project similarity signals, making it easier to build developer portfolios, project showcases, or internal catalog tools.

This is especially useful when you want to:

- showcase repositories in a portfolio website
- enrich repository data with README content and tags
- surface related projects based on similarities in language and topic
- keep a lightweight and secure API layer in front of GitHub

## Features

- repository listing from a GitHub profile
- repository detail lookup by name or URL fragment
- README extraction for richer UI content
- similarity suggestions for related projects
- CORS protection via configured allowed origins
- pagination support for collection responses
- OpenAPI documentation exposed through the root route

## API endpoints

- `GET /` → Swagger UI documentation page
- `GET /health` → simple health status for monitoring
- `GET /info` → API metadata including build, environment, and runtime details
- `GET /repos` → list repositories
- `GET /repos/<repo_name>` → return a single repository by name or URL fragment
- `GET /openapi.json` → OpenAPI schema

## Pagination

This API follows REST-friendly conventions for collection pagination by using response headers.

Request headers:

- `X-Page`: page number, starting at `1`
- `X-Page-Size`: number of items per page; optional and defaults to `10`

Response headers:

- `X-Page`
- `X-Page-Size`
- `X-Total-Count`
- `X-Total-Pages`

Response body when pagination is used:

- `content`: repositories in the current page
- `page`: current page number
- `pageSize`: page size used
- `totalPages`: total number of pages
- `totalRepositories`: total repository count

If no pagination headers are provided, the API returns the full list of repositories.

## Getting started

1. Create an account at Cloudflare if you do not already have one.
2. Clone this repository.
3. Copy the example environment file and fill in the required values:

```bash
cp .env.example .env
```

The following variables are required:

- `GH_USERNAME`: GitHub username used to fetch repositories
- `GH_TOKEN`: GitHub personal access token; strongly recommended to avoid rate limits
- `ALLOWED_ORIGINS`: comma-separated CORS origins, for example `http://localhost:8787,https://yourdomain.com`

For local Cloudflare development, you can also create a `.dev.vars` file with the same values.

4. Install dependencies:

```bash
npm install
```

5. Start the Worker locally:

```bash
npm run dev
```

The application will be available at:

- http://127.0.0.1:8787/
- http://127.0.0.1:8787/health
- http://127.0.0.1:8787/info
- http://127.0.0.1:8787/repos
- http://127.0.0.1:8787/repos/<repo_name>

### Health check example

```bash
curl http://127.0.0.1:8787/health
```

### Info example

```bash
curl http://127.0.0.1:8787/info
```

### Example request: cURL

```bash
curl -H "X-Page: 1" -H "X-Page-Size: 10" http://127.0.0.1:8787/repos
```

### Example request: fetch

```javascript
const response = await fetch('http://127.0.0.1:8787/repos', {
  method: 'GET',
  headers: {
    'X-Page': '1',
    'X-Page-Size': '10',
  },
});
```

## Deployment

```bash
npx wrangler login
npm run deploy
```

## Notes

- Requests are allowed only from origins configured in `ALLOWED_ORIGINS`.
- GitHub API calls are cached briefly to reduce unnecessary network traffic.
- The root route exposes Swagger UI and the OpenAPI document for easier inspection and testing.

## Author

<a href="https://github.com/euaaron">
  <figure align="center">
    <img src="https://github.com/euaaron.png" width="20%" />
    <figcaption>Aaron Carneiro</figcaption>
  </figure>
</a>
