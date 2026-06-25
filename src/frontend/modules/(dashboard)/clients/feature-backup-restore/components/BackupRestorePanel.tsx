'use client';
import { useState } from 'react';
import { Paper, Stack, Typography, Button, Divider, TextField, Box } from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import { useBackup } from '../application/use-backup';

export function BackupRestorePanel() {
  const { create, restore } = useBackup();
  const [backupPath, setBackupPath] = useState('');
  const [restorePath, setRestorePath] = useState('');

  const handleCreate = async () => {
    if (!backupPath) return;
    await create(backupPath);
  };

  const handleRestore = async () => {
    if (!restorePath) return;
    await restore(restorePath);
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3">Backup</Typography>
          <Typography variant="body2" color="text.secondary">
            Use VACUUM INTO to create a consistent SQLite snapshot.
          </Typography>
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Target backup file"
            size="small"
            value={backupPath}
            onChange={(e) => setBackupPath(e.target.value)}
            placeholder="e.g. ./backups/client-manager-2025-01-01.db"
          />
          <Box>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={handleCreate}
              disabled={!backupPath}
            >
              Create backup
            </Button>
          </Box>
        </Stack>

        <Divider />

        <Box>
          <Typography variant="h3">Restore</Typography>
          <Typography variant="body2" color="text.secondary">
            Restoring overwrites the current database. Reload the app afterwards.
          </Typography>
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Backup file to restore from"
            size="small"
            value={restorePath}
            onChange={(e) => setRestorePath(e.target.value)}
            placeholder="e.g. ./backups/client-manager-2025-01-01.db"
          />
          <Box>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RestoreIcon />}
              onClick={handleRestore}
              disabled={!restorePath}
            >
              Restore backup
            </Button>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
