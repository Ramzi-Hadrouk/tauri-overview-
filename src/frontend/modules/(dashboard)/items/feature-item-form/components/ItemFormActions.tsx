'use client';
import { DialogActions, Button, CircularProgress } from '@mui/material';
import { useItemFormStore } from '../application/item-form-store';
import { useItemForm } from '../application/use-item-form';

export function ItemFormActions() {
  const isSubmitting = useItemFormStore((s) => s.isSubmitting);
  const closeForm = useItemFormStore((s) => s.closeForm);
  const { submit } = useItemForm();

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
        {isSubmitting ? 'Saving\u2026' : 'Save'}
      </Button>
    </DialogActions>
  );
}
