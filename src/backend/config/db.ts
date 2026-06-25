// src/backend/config/db.ts
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { logger } from '@/backend/core/tracing';

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _sqlite: Database.Database | null = null;

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) throw new Error('Database not initialised. Call initDatabase() during bootstrap.');
  return _db;
}

export function getRawSqlite(): Database.Database {
  if (!_sqlite) throw new Error('Database not initialised.');
  return _sqlite;
}

export function initDatabase(dbPath: string): void {
  logger.info('database.initializing', { path: dbPath });
  _sqlite = new Database(dbPath);
  _sqlite.pragma('journal_mode = WAL');
  _sqlite.pragma('foreign_keys = ON');
  _sqlite.pragma('synchronous = NORMAL');
  _sqlite.pragma('busy_timeout = 5000');
  _db = drizzle(_sqlite, { schema });
  logger.info('database.ready', { path: dbPath });
}

export function closeDatabase(): void {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    _db = null;
    logger.info('database.closed');
  }
}
