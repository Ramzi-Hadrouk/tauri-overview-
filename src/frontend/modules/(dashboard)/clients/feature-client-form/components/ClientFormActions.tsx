'use client';
import { DialogActions, Button, CircularProgress } from '@mui/material';
import { useClientFormStore } from '../application/client-form-store';
import { useClientForm } from '../application/use-client-form';

export function ClientFormActions() {
  const isSubmitting = useClientFormStore((s) => s.isSubmitting);
  const closeForm = useClientFormStore((s) => s.closeForm);
  const { submit } = useClientForm();

  return (
    <DialogActions>
      <Button onClick={closeForm} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        onClick={submit}
        variant="contained"
        disabled={isSubmitting}
        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {isSubmitting ? 'Saving…' : 'Save'}
      </Button>
    </DialogActions>
  );
}
