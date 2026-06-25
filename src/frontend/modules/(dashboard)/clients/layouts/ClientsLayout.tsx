// src/frontend/modules/(dashboard)/clients/layouts/ClientsLayout.tsx
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * Clients module layout — adds the section heading and
 * any module-wide toolbar (action buttons, filter bar, etc.).
 * Rendered INSIDE DashboardShell by the page.
 */
export function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h2">Clients</Typography>
      {children}
    </Box>
  );
}