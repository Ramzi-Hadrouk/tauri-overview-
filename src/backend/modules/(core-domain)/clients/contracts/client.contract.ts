// src/backend/modules/(core-domain)/clients/contracts/client.contract.ts
import { invokeService } from '@/backend/core/service-invoker';
import type { Client, ClientCreateData, ClientUpdateData } from '../domain/entities';
import type { ClientFilters } from '../dto/client-filters.dto';
import type { PaginatedResult } from '@/backend/core/pagination';

export const clientContract = {
  async search(filters: ClientFilters): Promise<PaginatedResult<Client>> {
    const r = await invokeService('searchClientsService', 'execute', filters);
    if (!r.ok) throw r.error;
    return r.value as PaginatedResult<Client>;
  },

  async create(data: ClientCreateData): Promise<Client> {
    const r = await invokeService('createClientService', 'execute', data);
    if (!r.ok) throw r.error;
    return r.value as Client;
  },

  async update(id: string, data: ClientUpdateData): Promise<Client> {
    const r = await invokeService('updateClientService', 'execute', id, data);
    if (!r.ok) throw r.error;
    return r.value as Client;
  },

  async delete(id: string): Promise<void> {
    const r = await invokeService('deleteClientService', 'execute', id);
    if (!r.ok) throw r.error;
  },
};