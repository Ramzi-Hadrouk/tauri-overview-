import { DashboardShell } from '@/frontend/shared/layouts/dashboard-shell';
import { Box, Typography } from '@mui/material';

export default function SettingsPage() {
  return (
    <DashboardShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h2">Settings</Typography>
        <Typography>Settings page content will go here</Typography>
      </Box>
    </DashboardShell>
  );
}