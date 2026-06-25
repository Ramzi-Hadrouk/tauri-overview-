// src/backend/modules/(core-domain)/clients/repositories/drizzle-client.repository.ts
import { eq, and, ilike, or, sql, desc, asc } from 'drizzle-orm';
import { getDb } from '@/backend/config/db';
import { clients } from '@/backend/config/schema';
import type { ClientRepository } from './client.repository';
import type { Client, ClientCreateData, ClientUpdateData } from '../domain/entities';
import type { ClientFilters } from '../dto/client-filters.dto';
import { clampPagination } from '@/backend/core/pagination';
import type { PaginatedResult } from '@/backend/core/pagination';
import { mapRowToClient } from './mappers';
import { ClientAlreadyExistsError, ClientNotFoundError } from '../domain/exceptions';

export class DrizzleClientRepository implements ClientRepository {
  private get db() { return getDb(); }

  async getById(id: string): Promise<Client | null> {
    const rows = await this.db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return rows[0] ? mapRowToClient(rows[0]) : null;
  }

  async getByEmail(email: string): Promise<Client | null> {
    const rows = await this.db.select().from(clients)
      .where(eq(clients.email, email.toLowerCase())).limit(1);
    return rows[0] ? mapRowToClient(rows[0]) : null;
  }

  async search(filters: ClientFilters): Promise<PaginatedResult<Client>> {
    const { page, size, offset } = clampPagination(filters.page, filters.size);

    const conditions = [];
    if (filters.query) {
      const term = `%${filters.query.toLowerCase()}%`;
      conditions.push(or(
        ilike(clients.firstName, term),
        ilike(clients.lastName, term),
        ilike(clients.email, term),
        ilike(clients.phone, term),
      )!);
    }
    if (filters.archived !== undefined) conditions.push(eq(clients.archived, filters.archived));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy =
      filters.sortBy === 'createdAt'
        ? filters.sortDir === 'asc' ? asc(clients.createdAt) : desc(clients.createdAt)
        : filters.sortDir === 'asc' ? asc(clients.lastName)  : desc(clients.lastName);

    const [rows, totalRows] = await Promise.all([
      this.db.select().from(clients).where(where).orderBy(orderBy).limit(size).offset(offset),
      this.db.select({ count: sql<number>`count(*)` }).from(clients).where(where),
    ]);

    const total = totalRows[0]?.count ?? 0;
    return { items: rows.map(mapRowToClient), total, page, size, totalPages: Math.ceil(total / size) };
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const cond = excludeId !== undefined
      ? and(eq(clients.email, email.toLowerCase()), sql`${clients.id} != ${excludeId}`)
      : eq(clients.email, email.toLowerCase());
    const rows = await this.db.select({ id: clients.id }).from(clients).where(cond).limit(1);
    return rows.length > 0;
  }

  async save(data: ClientCreateData): Promise<Client> {
    try {
      const [row] = await this.db.insert(clients).values({
        firstName: data.firstName.trim(),
        lastName:  data.lastName.trim(),
        phone:     data.phone?.trim() ?? null,
        email:     data.email?.toLowerCase().trim() ?? null,
      }).returning();
      return mapRowToClient(row);
    } catch (err: unknown) {
      // SQLite UNIQUE constraint violation (code 2067 / SQLITE_CONSTRAINT_UNIQUE)
      if (isSqliteUniqueError(err) && data.email) {
        throw new ClientAlreadyExistsError(data.email);
      }
      throw err;
    }
  }

  async update(id: string, data: ClientUpdateData): Promise<Client> {
    const patch: Record<string, unknown> = {};
    if (data.firstName !== undefined) patch.firstName = data.firstName.trim();
    if (data.lastName  !== undefined) patch.lastName  = data.lastName.trim();
    if (data.phone     !== undefined) patch.phone     = data.phone.trim() || null;
    if (data.email     !== undefined) patch.email     = data.email.toLowerCase().trim() || null;
    const [row] = await this.db.update(clients).set(patch).where(eq(clients.id, id)).returning();
    if (!row) throw new ClientNotFoundError(id);
    return mapRowToClient(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(clients).where(eq(clients.id, id));
  }

  async count(): Promise<number> {
    const rows = await this.db.select({ count: sql<number>`count(*)` }).from(clients);
    return rows[0]?.count ?? 0;
  }
}

/** Detect a SQLite UNIQUE-constraint violation from better-sqlite3. */
function isSqliteUniqueError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    return (err as { code: string }).code === 'SQLITE_CONSTRAINT_UNIQUE';
  }
  // better-sqlite3 sets .message to contain 'UNIQUE constraint failed'
  if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
    return true;
  }
  return false;
}
