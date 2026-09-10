# Better Repos

Better Repos is a Cloudflare Worker that exposes <GITHUB_USERNAME>'s GitHub repositories.

## Why setting up this Worker instead of just getting repositories directly from GitHub API?

The API provides a list of public GitHub repositories with metadata such as name, description, tags, README, homepage, and language, and allows you to match repositories by similarity based on tags and language.

For example, Imagine you have a repository with the backend of an application and another repo with the frontend, with this API, when listing your backend (or frontend) the other repo will be provided in the json inside a `similarTo` entry, allowing you to display it in your portfolio website, improving the UX for a visitor to know your projects.

## API routes

- GET / → Swagger UI (documentation) page
- GET /repos → list all repositories
- GET /repos?name=some-name → return a single project by name or URL fragment
- GET /openapi.json → OpenAPI schema

## Configuration

- Create an account at Cloudflare if you don't have one yet;
- Clone this repository;
- Create and fill up `.env` and `.dev.vars` with the environment variables;
- Run `npm i` and `npm run dev` to try if it's working;
- Deploy to Cloudflare and assign your desired domain name, or use the free worker domain it provides.

### Example environment

I left a `.env.example` and a `.dev.vars.example` file to help you setup yours.

```bash
cp .env.example .env
```

The environment variables are:

- `GITHUB_USERNAME`: GitHub username used to fetch repositories
- `GITHUB_TOKEN`: optional GitHub personal access token; strongly recommended to avoid rate limits
- `ALLOWED_ORIGINS`: comma-separated list of allowed origins for CORS, for example `http://localhost:8787,https://yourdomain.com`

For local Cloudflare development, you can also create a `.dev.vars` file with the same values.

## Local development

```bash
npm install
npm run dev
```

The API will be available at:

- http://127.0.0.1:8787/
- http://127.0.0.1:8787/repos

## Deployment

```bash
npm install
npx wrangler login
npm run deploy
```

## Notes

- Requests are allowed only from the origins configured in `ALLOWED_ORIGINS`.
- GitHub API calls are cached briefly to reduce unnecessary network requests.
