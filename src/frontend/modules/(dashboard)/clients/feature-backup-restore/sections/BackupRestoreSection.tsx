'use client';
import { Stack } from '@mui/material';
import { BackupRestorePanel, BackupStatusDisplay } from '../components';
import { useBackup } from '../application/use-backup';

export function BackupRestoreSection() {
  const { lastBackupPath } = useBackup();

  return (
    <Stack spacing={2}>
      <BackupStatusDisplay lastBackupPath={lastBackupPath} />
      <BackupRestorePanel />
    </Stack>
  );
}
