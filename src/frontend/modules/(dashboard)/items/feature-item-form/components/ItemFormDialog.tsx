'use client';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useItemFormStore } from '../application/item-form-store';
import { ItemFormFields } from './ItemFormFields';
import { ItemFormActions } from './ItemFormActions';
import { ItemFormErrorSummary } from './ItemFormErrorSummary';

export function ItemFormDialog() {
  const isOpen = useItemFormStore((s) => s.isOpen);
  const mode = useItemFormStore((s) => s.mode);
  const formKey = useItemFormStore((s) => s.formKey);
  const closeForm = useItemFormStore((s) => s.closeForm);

  const title = mode === 'create' ? 'New Item' : 'Edit Item';

  return (
    <Dialog
      open={isOpen}
      onClose={(_e, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') closeForm();
      }}
      maxWidth="sm"
      fullWidth
      aria-labelledby="item-form-title"
      key={formKey}
    >
      <DialogTitle id="item-form-title">{title}</DialogTitle>
      <DialogContent dividers>
        <ItemFormErrorSummary />
        <ItemFormFields />
      </DialogContent>
      <ItemFormActions />
    </Dialog>
  );
}
