'use client';
import { useCallback, useState } from 'react';
import { unwrap } from '@/backend/core/result';
import { invokeService } from '@/backend/core/service-invoker';
import { backupContract } from '@/backend/modules/(operations)/backup/contracts/backup.contract';
import { useNotification } from '@/frontend/shared/hooks/useNotification';
import { useUiStore } from '@/frontend/store/ui-store';

export function useBackup() {
  const { success, error } = useNotification();
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);
  const [lastBackupPath, setLastBackupPath] = useState<string | null>(null);

  const create = useCallback(
    async (targetPath: string) => {
      setGlobalLoading(true);
      try {
        const path = unwrap(await invokeService('createBackupService', 'execute', targetPath));
        setLastBackupPath(path);
        success(`Backup created at ${path}`);
        return path;
      } catch (err) {
        error(err instanceof Error ? err.message : String(err));
        throw err;
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
        unwrap(await invokeService('restoreBackupService', 'execute', backupPath));
        success('Backup restored. Reload the app to see changes.');
      } catch (err) {
        error(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setGlobalLoading(false);
      }
    },
    [setGlobalLoading, success, error],
  );

  const verify = useCallback(
    async (path: string) => {
      try {
        return await backupContract.verify(path);
      } catch (err) {
        error(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [error],
  );

  const getDbPath = useCallback(async () => {
    try {
      return await backupContract.getDbPath();
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [error]);

  return { create, restore, verify, getDbPath, lastBackupPath };
}
