'use client';
import { useCallback, useState } from 'react';
import { backupCommands } from '@/frontend/core/ipc/contracts/backup';
import { useNotification } from '@/frontend/core/hooks/useNotification';
import { useUiStore } from '@/frontend/store/ui-store';

export function useBackup() {
  const { success, error } = useNotification();
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);
  const [lastBackupPath, setLastBackupPath] = useState<string | null>(null);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);

  const create = useCallback(
    async (targetPath: string) => {
      setGlobalLoading(true);
      try {
        const result = await backupCommands.createBackup(targetPath);
        setLastBackupPath(result.data ?? targetPath);
        setLastBackupTime(new Date());
        success(`Backup created at ${result.data ?? targetPath}`);
      } catch (err) {
        error(err instanceof Error ? err.message : String(err));
      } finally {
        setGlobalLoading(false);
      }
    },
    [setGlobalLoading, success, error],
  );

  const restore = useCallback(
    async (backupPath: string) => {
      setGlobalLoading(true);
      try {
        await backupCommands.restoreBackup(backupPath);
        success('Backup restored. Reload the app to see changes.');
      } catch (err) {
        error(err instanceof Error ? err.message : String(err));
      } finally {
        setGlobalLoading(false);
      }
    },
    [setGlobalLoading, success, error],
  );

  const verify = useCallback(
    async (path: string) => {
      try {
        const result = await backupCommands.verifyBackup(path);
        return result.data ?? false;
      } catch (err) {
        error(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [error],
  );

  return { create, restore, verify, lastBackupPath, lastBackupTime };
}
