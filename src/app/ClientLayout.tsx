'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '@/frontend/core/theme';
import { useUiStore } from '@/frontend/store/ui-store';
import {
  NotificationStack,
  ConfirmDialogHost,
  LoadingOverlay,
} from '@/frontend/shared/ui';
import { useSyncExternalStore } from 'react';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeMode = useUiStore((s) => s.themeMode);
  const mounted = useHydrated();

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {!mounted ? null : (
        <>
          {children}
          <NotificationStack />
          <ConfirmDialogHost />
          <LoadingOverlay />
        </>
      )}
    </ThemeProvider>
  );
}

