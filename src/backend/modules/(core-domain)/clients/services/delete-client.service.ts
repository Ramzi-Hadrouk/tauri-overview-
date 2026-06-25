// src/backend/modules/(core-domain)/clients/services/delete-client.service.ts
import type { ClientRepository } from '../repositories/client.repository';
import { ClientNotFoundError } from '../domain/exceptions';
import { logger } from '@/backend/core/tracing';

export class DeleteClientService {
  constructor(private readonly repo: ClientRepository) {}

  async execute(id: string): Promise<void> {
    if (!await this.repo.getById(id)) throw new ClientNotFoundError(id);
    await this.repo.delete(id);
    logger.info('client.delete.success', { id });
  }
}