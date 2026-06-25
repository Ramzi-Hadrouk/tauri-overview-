// src/backend/modules/(core-domain)/clients/domain/exceptions.ts
import { ApplicationError } from '@/backend/core/exceptions';

export class ClientValidationError extends ApplicationError {
  constructor(message: string, public field?: string) { super('CLIENT_VALIDATION', message); }
}
export class ClientAlreadyExistsError extends ApplicationError {
  constructor(email: string) { super('CLIENT_EXISTS', `Client with email ${email} already exists`); }
}
export class ClientNotFoundError extends ApplicationError {
  constructor(id: string) { super('CLIENT_NOT_FOUND', `Client ${id} not found`); }
}