// src/backend/modules/(operations)/backup/services/restore-backup.service.ts
import { backupContract } from '../contracts/backup.contract';
import { logger } from '@/backend/core/tracing';

export class RestoreBackupService {
  async execute(backupPath: string): Promise<void> {
    const dbPath = await backupContract.getDbPath();
    logger.info('backup.restore.start', { backupPath, dbPath });
    
    // Verify backup before restoring
    const isValid = await backupContract.verify(backupPath);
    if (!isValid) {
      throw new Error('Backup file failed integrity check');
    }
    
    await backupContract.restore(backupPath, dbPath);
    logger.info('backup.restore.success');
  }
}