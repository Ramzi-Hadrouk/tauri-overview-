'use client';
import { Snackbar, Alert } from '@mui/material';
import { useUiStore } from '@/frontend/store/ui-store';

export function NotificationStack() {
  const { notifications, dismissNotification } = useUiStore();
  const current = notifications[0];

  if (!current) return null;

  return (
    <Snackbar
      key={current.id}
      open
      autoHideDuration={5000}
      onClose={() => dismissNotification(current.id)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={() => dismissNotification(current.id)}
        severity={current.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {current.message}
      </Alert>
    </Snackbar>
  );
}
