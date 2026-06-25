// src/backend/modules/(operations)/backup/repositories/backup.repository.ts
import type { BackupResult, RestoreResult } from '../domain/entities';

export interface BackupRepository {
  create(dbPath: string, targetPath: string): Promise<BackupResult>;
  restore(backupPath: string, targetPath: string): Promise<RestoreResult>;
  verify(path: string): Promise<boolean>;
}