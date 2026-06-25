// src/backend/modules/(core-domain)/clients/services/search-clients.service.ts
import type { ClientRepository } from '../repositories/client.repository';
import type { ClientFilters } from '../dto/client-filters.dto';
import type { PaginatedResult } from '@/backend/core/pagination';
import type { Client } from '../domain/entities';
import { logger } from '@/backend/core/tracing';

export class SearchClientsService {
  constructor(private readonly repo: ClientRepository) {}

  async execute(filters: ClientFilters): Promise<PaginatedResult<Client>> {
    logger.debug('search.clients', { filters });
    return this.repo.search(filters);
  }
}