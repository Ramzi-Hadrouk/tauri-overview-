'use client';
import { useState } from 'react';
import { Paper, Stack, Typography, Button, Divider, TextField, Box } from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import RestoreIcon from '@mui/icons-material/Restore';
import { useBackup } from '../application/use-backup';

export function BackupRestorePanel() {
  const { create, restore, getDbPath } = useBackup();
  const [dbPath, setDbPath] = useState('');
  const [backupPath, setBackupPath] = useState('');
  const [restorePath, setRestorePath] = useState('');

  const handleResolveDbPath = async () => {
    const path = await getDbPath();
    if (path) setDbPath(path);
  };

  const handleCreate = async () => {
    if (!dbPath || !backupPath) return;
    await create(dbPath, backupPath);
  };

  const handleRestore = async () => {
    if (!restorePath || !dbPath) return;
    await restore(restorePath, dbPath);
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
            label="Database path"
            size="small"
            value={dbPath}
            onChange={(e) => setDbPath(e.target.value)}
            placeholder="e.g. /path/to/client-manager.db"
            slotProps={{
              input: {
                endAdornment: (
                  <Button size="small" onClick={handleResolveDbPath}>
                    Use live DB
                  </Button>
                ),
              },
            }}
          />
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
              disabled={!dbPath || !backupPath}
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
              disabled={!dbPath || !restorePath}
            >
              Restore backup
            </Button>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
