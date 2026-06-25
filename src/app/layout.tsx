'use client';

import '@/frontend/styles/globals.css';

import type { Metadata } from 'next';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '@/frontend/core/theme';
import { useUiStore } from '@/frontend/store/ui-store';
import { initApp } from '@/bootstrap/app-init';
import { invoke } from '@/backend/shared/tauri/ipc-client';
import { useEffect, useState } from 'react';

export const metadata: Metadata = {
  title: 'Client Manager',
  description: 'Desktop client management application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeMode = useUiStore((s) => s.themeMode);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<string>('get_db_path')
      .then((dbPath) => initApp(dbPath))
      .then(() => setReady(true))
      .catch((err) => setError(String(err)));
  }, []);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {error
            ? <StartupError message={error} />
            : ready
              ? children
              : <BootSplash />}
        </ThemeProvider>
      </body>
    </html>
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