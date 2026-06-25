// src/backend/modules/(core-domain)/clients/services/create-client.service.ts
import type { ClientRepository } from '../repositories/client.repository';
import type { Client, ClientCreateData } from '../domain/entities';
import { ClientAlreadyExistsError, ClientValidationError } from '../domain/exceptions';
import { validateClientData } from '../domain/rules';
import { logger } from '@/backend/core/tracing';

export class CreateClientService {
  constructor(private readonly repo: ClientRepository) {}

  async execute(data: ClientCreateData): Promise<Client> {
    logger.info('client.create.start', { email: data.email });
    const errors = validateClientData(data);
    if (errors) {
      const firstField = Object.keys(errors)[0];
      throw new ClientValidationError(errors[firstField], firstField);
    }
    if (data.email && await this.repo.existsByEmail(data.email)) throw new ClientAlreadyExistsError(data.email);
    const created = await this.repo.save(data);
    logger.info('client.create.success', { id: created.id });
    return created;
  }
}