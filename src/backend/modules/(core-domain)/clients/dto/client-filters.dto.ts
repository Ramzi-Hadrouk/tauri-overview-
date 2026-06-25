// src/backend/modules/(core-domain)/clients/dto/client-filters.dto.ts
import { z } from 'zod';

export const clientFiltersSchema = z.object({
  query:   z.string().trim().optional(),
  archived: z.boolean().optional(),
  page:    z.number().int().min(1).default(1),
  size:    z.number().int().min(1).max(100).default(20),
  sortBy:  z.enum(['lastName', 'createdAt']).default('lastName'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});

export type ClientFilters = z.infer<typeof clientFiltersSchema>;