// src/backend/modules/(operations)/backup/contracts/backup.contract.ts
import { invoke } from '@/backend/shared/tauri/ipc-client';

/**
 * Public surface for all backup operations.
 * Feature hooks call this — never import ipc-client directly from the frontend.
 */
export const backupContract = {
  async create(dbPath: string, targetPath: string): Promise<{ path: string }> {
    const path = await invoke<string>('create_backup', { dbPath, targetPath });
    return { path };
  },
  async restore(backupPath: string, targetPath: string): Promise<void> {
    await invoke<void>('restore_backup', { backupPath, targetPath });
  },
  async verify(path: string): Promise<boolean> {
    return invoke<boolean>('verify_backup', { path });
  },
  async getDbPath(): Promise<string> {
    return invoke<string>('get_db_path');
  },
};