// src/backend/modules/(operations)/backup/services/create-backup.service.ts
import type { BackupContract } from '../contracts/backup.contract';
import { ApplicationError } from '@/backend/core/exceptions';
import { logger } from '@/backend/core/tracing';
import { redactPath } from '@/backend/shared/utils/redact-path';

/** Validate a user-supplied backup path. Defense-in-depth beneath the Rust allow-list. */
export function validateBackupPath(path: string): void {
  if (!path || !path.trim()) {
    throw new ApplicationError('BACKUP_INVALID_PATH', 'Backup path is required', { field: 'path' });
  }
  if (path.includes('..')) {
    throw new ApplicationError(
      'BACKUP_INVALID_PATH',
      'Backup path must not contain parent-directory segments',
      { field: 'path' },
    );
  }
  if (path.length > 1024) {
    throw new ApplicationError('BACKUP_INVALID_PATH', 'Backup path is too long', { field: 'path' });
  }
  if (!/\.(db|sqlite|sqlite3)$/i.test(path)) {
    throw new ApplicationError(
      'BACKUP_INVALID_PATH',
      'Backup path must end with .db, .sqlite, or .sqlite3',
      { field: 'path' },
    );
  }
}

export class CreateBackupService {
  constructor(private readonly contract: BackupContract) {}

  async execute(targetPath: string): Promise<string> {
    validateBackupPath(targetPath);
    const dbPath = await this.contract.getDbPath();
    // Log the redacted target name, not the absolute path (PII: home dir).
    logger.info('backup.create.start', { target: redactPath(targetPath) });
    const path = await this.contract.create(dbPath, targetPath);
    logger.info('backup.create.success', { target: redactPath(path) });
    return path;
  }
}
