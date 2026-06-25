// src/backend/modules/(core-domain)/clients/services/update-client.service.ts
import type { ClientRepository } from '../repositories/client.repository';
import type { ClientUpdateData } from '../domain/entities';
import { ClientNotFoundError, ClientValidationError } from '../domain/exceptions';
import { validateClientData } from '../domain/rules';
import { logger } from '@/backend/core/tracing';

export class UpdateClientService {
  constructor(private readonly repo: ClientRepository) {}

  async execute(id: string, data: ClientUpdateData) {
    const existing = await this.repo.getById(id);
    if (!existing) throw new ClientNotFoundError(id);
    const errors = validateClientData(data);
    if (errors) {
      const firstField = Object.keys(errors)[0];
      throw new ClientValidationError(errors[firstField], firstField);
    }
    if (data.email && data.email !== existing.email && await this.repo.existsByEmail(data.email, id))
      throw new ClientValidationError('Email already in use', 'email');
    const updated = await this.repo.update(id, data);
    logger.info('client.update.success', { id });
    return updated;
  }
}