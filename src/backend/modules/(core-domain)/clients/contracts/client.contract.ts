// src/backend/modules/(core-domain)/clients/contracts/client.contract.ts
import { invokeService } from '@/backend/core/service-invoker';
import { unwrap } from '@/backend/core/result';
import type { Client, ClientCreateData, ClientUpdateData } from '../domain/entities';
import type { ClientFilters } from '../dto/client-filters.dto';
import type { PaginatedResult } from '@/backend/core/pagination';

export const clientContract = {
  async search(filters: ClientFilters): Promise<PaginatedResult<Client>> {
    return unwrap(await invokeService('searchClientsService', 'execute', filters));
  },

  async create(data: ClientCreateData): Promise<Client> {
    return unwrap(await invokeService('createClientService', 'execute', data));
  },

  async update(id: string, data: ClientUpdateData): Promise<Client> {
    return unwrap(await invokeService('updateClientService', 'execute', id, data));
  },

  async delete(id: string): Promise<void> {
    unwrap(await invokeService('deleteClientService', 'execute', id));
  },
};