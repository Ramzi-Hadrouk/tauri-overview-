'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '@/frontend/core/theme';
import { useUiStore } from '@/frontend/store/ui-store';
import { invoke } from '@/backend/shared/tauri/ipc-client';
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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    invoke('get_db_path', {})
      .then(() => { if (!cancelled) setReady(true); })
      .catch((err) => { if (!cancelled) setError(String(err)); });
    return () => { cancelled = true; };
  }, []);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {error ? (
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      Starting up…
    </div>
  );
}

function StartupError({ message }: { message: string }) {
  return (
    <div style={{ padding: 32, color: 'red' }}>
      <h2>Application failed to start</h2>
      <pre>{message}</pre>
      <p>Restore a compatible backup, then restart the application.</p>
    </div>
  );
}
