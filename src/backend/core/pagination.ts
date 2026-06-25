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


