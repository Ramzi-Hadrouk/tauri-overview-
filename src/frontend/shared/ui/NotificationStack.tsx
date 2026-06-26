'use client';
import { Snackbar, Alert, Stack } from '@mui/material';
import { useUiStore } from '@/frontend/store/ui-store';

export function NotificationStack() {
  const { notifications, dismissNotification } = useUiStore();

  if (notifications.length === 0) return null;

  return (
    <Stack
      spacing={1}
      sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000 }}
    >
      {notifications.slice(0, 3).map((n) => (
        <Snackbar
          key={n.id}
          open
          autoHideDuration={5000}
          onClose={() => dismissNotification(n.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ position: 'static' }}
        >
          <Alert
            onClose={() => dismissNotification(n.id)}
            severity={n.severity}
            variant="filled"
            sx={{ width: '100%', minWidth: 300 }}
          >
            {n.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}
