// src/backend/modules/(core-domain)/clients/services/create-client.service.ts
import type { ClientRepository } from '../repositories/client.repository';
import type { Client, ClientCreateData } from '../domain/entities';
import { ClientAlreadyExistsError, ClientValidationError } from '../domain/exceptions';
import { validateClientName, validateEmailFormat, validatePhoneFormat } from '../domain/rules';
import { logger } from '@/backend/core/tracing';

export class CreateClientService {
  constructor(private readonly repo: ClientRepository) {}

  async execute(data: ClientCreateData): Promise<Client> {
    logger.info('client.create.start', { email: data.email });
    if (!validateClientName(data.firstName)) throw new ClientValidationError('First name required (max 100)', 'firstName');
    if (!validateClientName(data.lastName))  throw new ClientValidationError('Last name required (max 100)', 'lastName');
    if (data.email && !validateEmailFormat(data.email)) throw new ClientValidationError('Invalid email', 'email');
    if (data.phone && !validatePhoneFormat(data.phone)) throw new ClientValidationError('Invalid phone', 'phone');
    if (data.email && await this.repo.existsByEmail(data.email)) throw new ClientAlreadyExistsError(data.email);
    const created = await this.repo.save(data);
    logger.info('client.create.success', { id: created.id });
    return created;
  }
}