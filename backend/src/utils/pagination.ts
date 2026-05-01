const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export interface PaginationResult {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function parsePagination(page?: string, limit?: string): PaginationParams {
  let parsedPage = Number(page) || DEFAULT_PAGE
  let parsedLimit = Number(limit) || DEFAULT_LIMIT

  if (parsedPage < 1) parsedPage = DEFAULT_PAGE
  if (parsedLimit < 1) parsedLimit = DEFAULT_LIMIT
  if (parsedLimit > MAX_LIMIT) parsedLimit = MAX_LIMIT

  const skip = (parsedPage - 1) * parsedLimit

  return { page: parsedPage, limit: parsedLimit, skip }
}

export function buildPaginationResult(
  total: number,
  page: number,
  limit: number
): PaginationResult {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}