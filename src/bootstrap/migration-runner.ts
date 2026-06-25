// src/bootstrap/migration-runner.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDb } from '@/backend/config/db';
import { logger } from '@/backend/core/tracing';

export function runMigrations(): void {
  try {
    logger.info('migrations.start');
    migrate(getDb(), { migrationsFolder: './drizzle' });
    logger.info('migrations.complete');
  } catch (err) {
    logger.error('migrations.failed', { error: String(err) });
    throw err;
  }
}