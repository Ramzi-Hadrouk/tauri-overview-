'use client';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useClientFormStore } from '../application/client-form-store';
import { ClientFormFields } from './ClientFormFields';
import { ClientFormActions } from './ClientFormActions';
import { ClientFormErrorSummary } from './ClientFormErrorSummary';

export function ClientFormDialog() {
  const isOpen = useClientFormStore((s) => s.isOpen);
  const mode = useClientFormStore((s) => s.mode);
  const closeForm = useClientFormStore((s) => s.closeForm);

  const title = mode === 'create' ? 'New Client' : 'Edit Client';

  return (
    <Dialog
      open={isOpen}
      onClose={(_e, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') closeForm();
      }}
      maxWidth="sm"
      fullWidth
      aria-labelledby="client-form-title"
    >
      <DialogTitle id="client-form-title">{title}</DialogTitle>
      <DialogContent dividers>
        <ClientFormErrorSummary />
        <ClientFormFields />
      </DialogContent>
      <ClientFormActions />
    </Dialog>
  );
}
