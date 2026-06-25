// src/backend/core/pagination.ts
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
