'use client';
import { Backdrop, CircularProgress } from '@mui/material';
import { useUiStore } from '@/frontend/store/ui-store';

export function LoadingOverlay() {
  const globalLoading = useUiStore((s) => s.globalLoading);

  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + theme.zIndex.modal }}
      open={globalLoading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}
