// src/backend/modules/(operations)/backup/domain/entities.ts
// Domain types for the backup bounded context.
// These reflect the actual shapes that cross the service/contract boundary.

/** Result of a create-backup operation. `path` is the absolute backup file location. */
export interface BackupResult {
  path: string;
}

/** Result of a verify-backup operation. `valid` indicates integrity-check passed. */
export interface VerifyResult {
  valid: boolean;
}
