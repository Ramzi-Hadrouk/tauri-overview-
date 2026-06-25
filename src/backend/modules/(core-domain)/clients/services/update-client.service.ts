// src/backend/modules/(core-domain)/clients/services/update-client.service.ts
import type { ClientRepository } from '../repositories/client.repository';
import type { ClientUpdateData } from '../domain/entities';
import { ClientNotFoundError, ClientValidationError } from '../domain/exceptions';
import { validateClientName, validateEmailFormat, validatePhoneFormat } from '../domain/rules';
import { logger } from '@/backend/core/tracing';

export class UpdateClientService {
  constructor(private readonly repo: ClientRepository) {}

  async execute(id: string, data: ClientUpdateData) {
    const existing = await this.repo.getById(id);
    if (!existing) throw new ClientNotFoundError(id);
    if (data.firstName !== undefined && !validateClientName(data.firstName)) throw new ClientValidationError('First name invalid', 'firstName');
    if (data.lastName  !== undefined && !validateClientName(data.lastName))  throw new ClientValidationError('Last name invalid', 'lastName');
    if (data.email !== undefined && data.email && !validateEmailFormat(data.email)) throw new ClientValidationError('Invalid email', 'email');
    if (data.phone !== undefined && data.phone && !validatePhoneFormat(data.phone)) throw new ClientValidationError('Invalid phone', 'phone');
    if (data.email && data.email !== existing.email && await this.repo.existsByEmail(data.email, id))
      throw new ClientValidationError('Email already in use', 'email');
    const updated = await this.repo.update(id, data);
    logger.info('client.update.success', { id });
    return updated;
  }
}