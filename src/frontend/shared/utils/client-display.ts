import type { Client } from '@/domain/clients/entities';

export function getClientFullName(c: Pick<Client, 'firstName' | 'lastName'>): string {
  return `${c.firstName} ${c.lastName}`.trim();
}


