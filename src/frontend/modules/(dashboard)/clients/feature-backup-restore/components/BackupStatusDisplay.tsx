'use client';
import { Paper, Stack, Typography, Box } from '@mui/material';
import { formatDateTime } from '@/frontend/shared/utils/format-date';
import { truncate } from '@/frontend/shared/utils/truncate';

export interface BackupStatusDisplayProps {
  lastBackupPath: string | null;
}

export function BackupStatusDisplay({ lastBackupPath }: BackupStatusDisplayProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={0.5}>
        <Typography variant="overline" color="text.secondary">
          Last backup
        </Typography>
        {lastBackupPath ? (
          <>
            <Typography variant="body2">
              <Box component="span" sx={{ color: 'text.secondary' }}>
                Path:
              </Box>{' '}
              {truncate(lastBackupPath, 60)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Saved {formatDateTime(new Date())}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No backup created in this session.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
