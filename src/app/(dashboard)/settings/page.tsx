import { DashboardShell } from '@/frontend/shared/layouts/dashboard-shell';
import { Box, Typography } from '@mui/material';
import { BackupRestoreSection } from '@/frontend/modules/(dashboard)/clients/feature-backup-restore/sections/BackupRestoreSection';

export default function SettingsPage() {
  return (
    <DashboardShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h2">Settings</Typography>
        <BackupRestoreSection />
      </Box>
    </DashboardShell>
  );
}
