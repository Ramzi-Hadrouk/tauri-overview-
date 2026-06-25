import { invoke } from '@/domain/tauri/ipc-client';
import { ApplicationError } from '@/domain/core/exceptions';
import { logger } from '@/domain/core/tracing';
import { redactPath } from '@/domain/utils/redact-path';

function validateBackupPath(path: string): void {
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

export const backupContract = {
  async getDbPath(): Promise<string> {
    return invoke('get_db_path', {});
  },

  async create(targetPath: string): Promise<string> {
    validateBackupPath(targetPath);
    const dbPath = await this.getDbPath();
    logger.info('backup.create.start', { target: redactPath(targetPath) });
    const path = await invoke('create_backup', { dbPath, targetPath });
    logger.info('backup.create.success', { target: redactPath(path) });
    return path;
  },

  async restore(backupPath: string): Promise<void> {
    validateBackupPath(backupPath);
    logger.info('backup.restore.start', { source: redactPath(backupPath) });
    await invoke('restore_backup', { backupPath });
    logger.info('backup.restore.success');
  },

  async verify(path: string): Promise<boolean> {
    return invoke('verify_backup', { path });
  },
};
