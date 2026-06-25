// src/backend/modules/(core-domain)/clients/domain/rules.ts
import type { Client, ClientCreateData, ClientUpdateData } from './entities';

export const MAX_NAME_LENGTH = 100;
export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 15;

export function validateClientName(name: string): boolean {
  const t = name.trim();
  return t.length > 0 && t.length <= MAX_NAME_LENGTH;
}

export function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhoneFormat(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function getClientFullName(c: Pick<Client, 'firstName' | 'lastName'>): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

export interface ValidationErrors {
  [field: string]: string;
}

export function validateClientData(input: ClientCreateData | ClientUpdateData): ValidationErrors | null {
  const errors: ValidationErrors = {};
  const isCreate = 'firstName' in input && input.firstName !== undefined;
  const firstName = (input as ClientCreateData).firstName;
  const lastName = (input as ClientCreateData).lastName;
  if (firstName !== undefined && !validateClientName(firstName)) {
    errors.firstName = `First name is required and must be at most ${MAX_NAME_LENGTH} characters`;
  }
  if (lastName !== undefined && !validateClientName(lastName)) {
    errors.lastName = `Last name is required and must be at most ${MAX_NAME_LENGTH} characters`;
  }
  if (input.email && !validateEmailFormat(input.email)) {
    errors.email = 'Invalid email format';
  }
  if (input.phone && !validatePhoneFormat(input.phone)) {
    errors.phone = `Phone must have between ${PHONE_MIN_DIGITS} and ${PHONE_MAX_DIGITS} digits`;
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export function sortClientsByName(clients: Client[]): Client[] {
  return [...clients].sort((a, b) => {
    const ln = a.lastName.localeCompare(b.lastName);
    return ln !== 0 ? ln : a.firstName.localeCompare(b.firstName);
  });
}