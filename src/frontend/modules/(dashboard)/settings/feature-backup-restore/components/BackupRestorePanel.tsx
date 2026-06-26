'use client';
import { Paper, Stack, Typography, Button, Divider, Box } from '@mui/material';
import BackupIcon from '@mui/icons-material/Backup';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { save, open } from '@tauri-apps/plugin-dialog';
import { useBackup } from '../application/use-backup';

const DB_FILTER = [{ name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] }];

export function BackupRestorePanel() {
  const { create, restore } = useBackup();

  const handleCreate = async () => {
    const path = await save({
      filters: DB_FILTER,
      defaultPath: `backup-${new Date().toISOString().slice(0, 10)}.db`,
    });
    if (!path) return;
    await create(path);
  };

  const handleRestore = async () => {
    const path = await open({
      filters: DB_FILTER,
      multiple: false,
      directory: false,
    });
    if (!path) return;
    await restore(path);
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

        <Box>
          <Button variant="contained" startIcon={<BackupIcon />} onClick={handleCreate}>
            Create backup
          </Button>
        </Box>

        <Divider />

        <Box>
          <Typography variant="h3">Restore</Typography>
          <Typography variant="body2" color="text.secondary">
            Restoring overwrites the current database. Reload the app afterwards.
          </Typography>
        </Box>

        <Box>
          <Button variant="outlined" color="warning" startIcon={<FolderOpenIcon />} onClick={handleRestore}>
            Choose backup file to restore
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
