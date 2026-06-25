// src/backend/modules/(core-domain)/clients/repositories/mappers.ts
import type { Client } from '../domain/entities';

type ClientRow = {
  id: string; firstName: string; lastName: string;
  phone: string | null; email: string | null;
  archived: boolean; createdAt: Date; updatedAt: Date;
};

export function mapRowToClient(row: ClientRow): Client {
  return {
    id: row.id, firstName: row.firstName, lastName: row.lastName,
    phone: row.phone, email: row.email, archived: row.archived,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}