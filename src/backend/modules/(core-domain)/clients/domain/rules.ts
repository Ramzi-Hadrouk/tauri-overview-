// src/backend/modules/(core-domain)/clients/domain/rules.ts
import type { Client } from './entities';

export function validateClientName(name: string): boolean {
  const t = name.trim();
  return t.length > 0 && t.length <= 100;
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

export function sortClientsByName(clients: Client[]): Client[] {
  return [...clients].sort((a, b) => {
    const ln = a.lastName.localeCompare(b.lastName);
    return ln !== 0 ? ln : a.firstName.localeCompare(b.firstName);
  });
}