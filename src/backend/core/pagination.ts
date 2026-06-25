// src/backend/core/pagination.ts

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/** Default page number when none is requested. */
export const DEFAULT_PAGE = 1;

/** Default page size when none is requested. */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum page size allowed. Guards against unbounded queries. */
export const MAX_PAGE_SIZE = 100;

export interface ResolvedPagination {
  page: number;
  size: number;
  offset: number;
}

/**
 * Normalize and clamp pagination inputs into a validated {page, size, offset}.
 * Centralized so every repository applies identical bounds.
 */
export function clampPagination(page?: number, size?: number): ResolvedPagination {
  const p = Number.isInteger(page) && (page as number) > 0 ? (page as number) : DEFAULT_PAGE;
  const s =
    Number.isInteger(size) && (size as number) > 0
      ? Math.min(size as number, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  return { page: p, size: s, offset: (p - 1) * s };
}
