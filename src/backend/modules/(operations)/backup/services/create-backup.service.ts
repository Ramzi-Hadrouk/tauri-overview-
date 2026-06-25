// src/backend/modules/(operations)/backup/services/create-backup.service.ts
import { backupContract } from '../contracts/backup.contract';
import { logger } from '@/backend/core/tracing';

export class CreateBackupService {
  async execute(targetPath: string): Promise<string> {
    const dbPath = await backupContract.getDbPath();
    logger.info('backup.create.start', { dbPath, targetPath });
    const result = await backupContract.create(dbPath, targetPath);
    logger.info('backup.create.success', { path: result.path });
    return result.path;
  }
}