import { invoke } from '@/domain/tauri/ipc-client';
import type { Client, ClientCreateData, ClientUpdateData } from './entities';
import type { ClientFilters } from './client-filters.dto';
import type { PaginatedResult } from '@/domain/core/pagination';

export const clientContract = {
  async getById(id: string): Promise<Client> {
    return invoke('get_client', { id });
  },

  async search(filters: ClientFilters): Promise<PaginatedResult<Client>> {
    return invoke('search_clients', { filters });
  },

  async create(data: ClientCreateData): Promise<Client> {
    return invoke('create_client', { data });
  },

  async update(id: string, data: ClientUpdateData): Promise<Client> {
    return invoke('update_client', { id, data });
  },

  async delete(id: string): Promise<void> {
    await invoke('delete_client', { id });
  },
};
