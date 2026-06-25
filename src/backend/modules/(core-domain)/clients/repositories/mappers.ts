// src/backend/modules/(core-domain)/clients/repositories/mappers.ts
import type { Client } from '../domain/entities';
import type { clients } from '@/backend/config/schema';

type ClientRow = typeof clients.$inferSelect;

export function mapRowToClient(row: ClientRow): Client {
  return {
    id: row.id, firstName: row.firstName, lastName: row.lastName,
    phone: row.phone, email: row.email, archived: row.archived,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}