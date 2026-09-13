const DEFAULT_PAGE_SIZE = 10;

export function normalizePositiveInteger(value: string | null, name: string): number | null {
  if (value === null) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsedValue;
}

export function paginateRepositories(repositories: any[], page: number | null, pageSize: number) {
  const resolvedPage = page ?? 1;
  const totalRepositories = repositories.length;
  const totalPages = totalRepositories === 0 ? 0 : Math.ceil(totalRepositories / pageSize);
  const safePage = Math.min(resolvedPage, totalPages === 0 ? 1 : totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    content: repositories.slice(startIndex, endIndex),
    page: safePage,
    pageSize,
    totalPages,
    totalRepositories,
  };
}

export function buildPaginationHeaders(page: number, pageSize: number, totalRepositories: number): Headers {
  const totalPages = totalRepositories === 0 ? 0 : Math.ceil(totalRepositories / pageSize);
  const headers = new Headers();

  headers.set('X-Page', String(page));
  headers.set('X-Page-Size', String(pageSize));
  headers.set('X-Total-Count', String(totalRepositories));
  headers.set('X-Total-Pages', String(totalPages));

  return headers;
}

export function getPaginationConfig(request: Request, url: URL) {
  const queryPage = normalizePositiveInteger(url.searchParams.get('page'), 'page');
  const queryPageSize = normalizePositiveInteger(url.searchParams.get('page_size'), 'page_size');
  const headerPage = normalizePositiveInteger(request.headers.get('X-Page'), 'X-Page');
  const headerPageSize = normalizePositiveInteger(request.headers.get('X-Page-Size'), 'X-Page-Size');

  const page = headerPage ?? queryPage;
  const pageSize = headerPageSize ?? queryPageSize ?? DEFAULT_PAGE_SIZE;
  const isPaginatedRequest =
    request.headers.has('X-Page') ||
    request.headers.has('X-Page-Size') ||
    url.searchParams.has('page') ||
    url.searchParams.has('page_size');

  return { page, pageSize, isPaginatedRequest };
}
