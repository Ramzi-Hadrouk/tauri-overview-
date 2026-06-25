// src/backend/modules/(core-domain)/clients/repositories/client.repository.ts
import type { Client, ClientCreateData, ClientUpdateData } from '../domain/entities';
import type { ClientFilters } from '../dto/client-filters.dto';
import type { PaginatedResult } from '@/backend/core/pagination';

export interface ClientRepository {
  getById(id: string): Promise<Client | null>;
  getByEmail(email: string): Promise<Client | null>;
  search(filters: ClientFilters): Promise<PaginatedResult<Client>>;
  existsByEmail(email: string, excludeId?: string): Promise<boolean>;
  save(data: ClientCreateData): Promise<Client>;
  update(id: string, data: ClientUpdateData): Promise<Client>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}