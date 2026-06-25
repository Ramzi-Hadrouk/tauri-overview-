// src/backend/config/schema-version.ts
/**
 * Schema versioning constants.
 *
 * These describe the application's database schema, not its environment, so
 * they live here next to the version guard rather than under env config.
 */

/** Schema version produced by the current build of the app. */
export const APP_SCHEMA_VERSION = 2;

/** Lowest schema version this build can still open. Older DBs must be restored. */
export const MIN_COMPATIBLE_SCHEMA_VERSION = 1;
