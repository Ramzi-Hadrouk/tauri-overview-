import { invoke } from '../base/invoke';
import type { IpcResponse } from '@/frontend/shared/types/generated/IpcResponse';

export const backupCommands = {
  createBackup: (targetPath: string): Promise<IpcResponse<string>> =>
    invoke('create_backup', { targetPath }),

  restoreBackup: (backupPath: string): Promise<IpcResponse<null>> =>
    invoke('restore_backup', { backupPath }),

  verifyBackup: (path: string): Promise<IpcResponse<boolean>> =>
    invoke('verify_backup', { path }),
} as const;
