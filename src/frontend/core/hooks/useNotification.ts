'use client';
import { useCallback } from 'react';
import { useUiStore } from '@/frontend/store/ui-store';

export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error';

export interface NotifyOptions {
  severity?: NotificationSeverity;
  message: string;
  autoHideMs?: number;
}

export function useNotification() {
  const pushNotification = useUiStore((s) => s.pushNotification);
  const dismissNotification = useUiStore((s) => s.dismissNotification);

  const notify = useCallback(
    (opts: NotifyOptions) => {
      pushNotification({
        severity: opts.severity ?? 'info',
        message: opts.message,
      });
    },
    [pushNotification],
  );

  const success = useCallback(
    (message: string) => pushNotification({ severity: 'success', message }),
    [pushNotification],
  );
  const info = useCallback(
    (message: string) => pushNotification({ severity: 'info', message }),
    [pushNotification],
  );
  const warning = useCallback(
    (message: string) => pushNotification({ severity: 'warning', message }),
    [pushNotification],
  );
  const error = useCallback(
    (message: string) => pushNotification({ severity: 'error', message }),
    [pushNotification],
  );

  return { notify, success, info, warning, error, dismissNotification };
}
