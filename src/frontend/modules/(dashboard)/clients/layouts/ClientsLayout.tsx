// src/frontend/modules/(dashboard)/clients/layouts/ClientsLayout.tsx
import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * Clients module layout — adds the section heading and
 * any module-wide toolbar (action buttons, filter bar, etc.).
 * Rendered INSIDE DashboardShell by the page.
 */
export function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="h2">Clients</Typography>
      </Stack>
      {children}
    </Box>
  );
}
