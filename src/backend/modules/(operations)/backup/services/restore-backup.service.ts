// src/backend/modules/(operations)/backup/services/restore-backup.service.ts
import type { BackupContract } from '../contracts/backup.contract';
import { validateBackupPath } from './create-backup.service';
import { logger } from '@/backend/core/tracing';
import { redactPath } from '@/backend/shared/utils/redact-path';

export class RestoreBackupService {
  constructor(private readonly contract: BackupContract) {}

  async execute(backupPath: string): Promise<void> {
    validateBackupPath(backupPath);
    const dbPath = await this.contract.getDbPath();
    logger.info('backup.restore.start', { source: redactPath(backupPath) });

    // Integrity is verified inside restore_backup itself, so we do NOT
    // call verify() here: a separate verify() + restore() would be a TOCTOU
    // race (the file could change between check and use) and a redundant IPC.
    await this.contract.restore(backupPath, dbPath);
    logger.info('backup.restore.success');
  }
}
