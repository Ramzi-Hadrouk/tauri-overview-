'use client';

import { Box, Typography, ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '@/frontend/core/theme';
import { useUiStore } from '@/frontend/store/ui-store';
import { backupContract } from '@/domain/backup/contract';
import {
  NotificationStack,
  ConfirmDialogHost,
  LoadingOverlay,
} from '@/frontend/shared/ui';
import { useEffect, useState } from 'react';

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeMode = useUiStore((s) => s.themeMode);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    backupContract.getDbPath()
      .then(() => { if (!cancelled) setReady(true); })
      .catch((err) => { if (!cancelled) setError(String(err)); });
    return () => { cancelled = true; };
  }, [mounted]);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!mounted ? null : error ? (
        <StartupError message={error} />
      ) : ready ? (
        <>
          {children}
          <NotificationStack />
          <ConfirmDialogHost />
          <LoadingOverlay />
        </>
      ) : (
        <BootSplash />
      )}
    </ThemeProvider>
  );
}

function BootSplash() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Typography>Starting up…</Typography>
    </Box>
  );
}

function StartupError({ message }: { message: string }) {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h2" color="error" gutterBottom>
        Application failed to start
      </Typography>
      <Box component="pre" sx={{ mb: 2, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        {message}
      </Box>
      <Typography>Restore a compatible backup, then restart the application.</Typography>
    </Box>
  );
}
