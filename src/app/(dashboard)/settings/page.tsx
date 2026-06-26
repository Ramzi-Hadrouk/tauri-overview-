import { DashboardShell } from '@/frontend/shared/layouts/dashboard-group/dashboard-layout';
import { Box, Typography } from '@mui/material';
import { BackupRestoreSection } from '@/frontend/modules/(dashboard)/settings';

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
