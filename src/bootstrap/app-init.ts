// src/bootstrap/app-init.ts
import { initDatabase } from '@/backend/config/db';
import { runMigrations } from './migration-runner';
import { assertSchemaCompatible } from './version-guard';
import { logger } from '@/backend/core/tracing';
import { container } from '@/backend/di/container';

let initialized = false;

export async function initApp(dbPath: string): Promise<void> {
  if (initialized) return;
  logger.info('app.bootstrap.start', { dbPath });
  initDatabase(dbPath);
  runMigrations();
  assertSchemaCompatible();
  initialized = true;
  logger.info('app.bootstrap.complete');
}

export { container };