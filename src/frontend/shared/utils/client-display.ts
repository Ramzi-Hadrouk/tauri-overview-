import type { Client } from '@/backend/modules/(core-domain)/clients/domain/entities';

export function getClientFullName(c: Pick<Client, 'firstName' | 'lastName'>): string {
  return `${c.firstName} ${c.lastName}`.trim();
}


