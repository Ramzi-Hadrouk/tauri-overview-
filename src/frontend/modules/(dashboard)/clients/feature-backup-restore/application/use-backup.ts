'use client';
import { useCallback, useState } from 'react';
import { backupContract } from '@/backend/modules/(operations)/backup/contracts/backup.contract';
import { useNotification } from '@/frontend/shared/hooks/useNotification';
import { useUiStore } from '@/frontend/store/ui-store';

export function useBackup() {
  const { success, error } = useNotification();
  const setGlobalLoading = useUiStore((s) => s.setGlobalLoading);
  const [lastBackupPath, setLastBackupPath] = useState<string | null>(null);

  const create = useCallback(
    async (dbPath: string, targetPath: string) => {
      setGlobalLoading(true);
      try {
        const result = await backupContract.create(dbPath, targetPath);
        setLastBackupPath(result.path);
        success(`Backup created at ${result.path}`);
        return result;
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
    async (backupPath: string, targetPath: string) => {
      setGlobalLoading(true);
      try {
        await backupContract.restore(backupPath, targetPath);
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
