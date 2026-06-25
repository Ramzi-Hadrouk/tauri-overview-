// src/bootstrap/version-guard.ts
import { getDb } from '@/backend/config/db';
import { schemaMeta } from '@/backend/config/schema';
import { eq } from 'drizzle-orm';
import { AppConfig } from '@/backend/config/env';
import { logger } from '@/backend/core/tracing';
import { SchemaIncompatibleError } from '@/backend/core/exceptions';

export function readDbVersion(): number {
  const db = getDb();
  const row = db.select().from(schemaMeta).where(eq(schemaMeta.key, 'app_schema_version')).get();
  return row ? Number(row.value) : 0;
}

export function writeDbVersion(version: number): void {
  getDb()
    .insert(schemaMeta)
    .values({ key: 'app_schema_version', value: String(version) })
    .onConflictDoUpdate({ target: schemaMeta.key, set: { value: String(version) } })
    .run();
}

export function assertSchemaCompatible(): void {
  const current = readDbVersion();
  logger.info('schema.version.check', { current, expected: AppConfig.APP_SCHEMA_VERSION });

  if (current === 0) {
    // Fresh install — stamp the version and let migrations create the tables.
    writeDbVersion(AppConfig.APP_SCHEMA_VERSION);
    return;
  }
  if (current < AppConfig.MIN_COMPATIBLE_SCHEMA_VERSION) {
    throw new SchemaIncompatibleError(
      `DB schema v${current} is below minimum v${AppConfig.MIN_COMPATIBLE_SCHEMA_VERSION}. Restore a compatible backup.`
    );
  }
  if (current > AppConfig.APP_SCHEMA_VERSION) {
    throw new SchemaIncompatibleError(
      `DB schema v${current} is newer than this app (v${AppConfig.APP_SCHEMA_VERSION}). Update the application.`
    );
  }
  writeDbVersion(AppConfig.APP_SCHEMA_VERSION);
}