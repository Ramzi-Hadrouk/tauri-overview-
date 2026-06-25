// src/backend/modules/(operations)/backup/contracts/backup.contract.ts
import { invoke } from '@/backend/shared/tauri/ipc-client';

/**
 * Public surface for all backup operations.
 * Feature hooks call this — never import ipc-client directly from the frontend.
 */
export interface BackupContract {
  /** Path to the live database file (resolved server-side). */
  getDbPath(): Promise<string>;
  /** Create a new backup of the live DB at `targetPath`. Returns the backup path. */
  create(dbPath: string, targetPath: string): Promise<string>;
  /** Restore `backupPath` over the live DB. Runs an integrity check first. */
  restore(backupPath: string, dbPath: string): Promise<void>;
  /** Integrity-check an existing backup file. */
  verify(path: string): Promise<boolean>;
}

export const backupContract: BackupContract = {
  async getDbPath(): Promise<string> {
    return invoke('get_db_path', {});
  },
  async create(dbPath: string, targetPath: string): Promise<string> {
    return invoke('create_backup', { dbPath, targetPath });
  },
  async restore(backupPath: string, dbPath: string): Promise<void> {
    await invoke('restore_backup', { backupPath, targetPath: dbPath });
  },
  async verify(path: string): Promise<boolean> {
    return invoke('verify_backup', { path });
  },
};
