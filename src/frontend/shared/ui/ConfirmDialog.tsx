'use client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useUiStore } from '@/frontend/store/ui-store';

export function ConfirmDialog() {
  const { confirm, closeConfirm } = useUiStore();

  const handleConfirm = () => {
    confirm.onConfirm?.();
    closeConfirm();
  };

  const handleCancel = () => {
    confirm.onCancel?.();
    closeConfirm();
  };

  return (
    <Dialog
      open={confirm.open}
      onClose={handleCancel}
      maxWidth="xs"
      fullWidth
      aria-labelledby="confirm-dialog-title"
    >
      <DialogTitle id="confirm-dialog-title">{confirm.title || 'Confirm'}</DialogTitle>
      <DialogContent>
        <DialogContentText>{confirm.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary" autoFocus>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
