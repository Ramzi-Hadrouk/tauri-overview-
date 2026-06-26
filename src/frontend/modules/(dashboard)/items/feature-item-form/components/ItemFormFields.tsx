'use client';
import { useRef } from 'react';
import { Box, Stack, FormControlLabel, Switch, Typography, Button, Avatar } from '@mui/material';
import { FormField } from '@/frontend/shared/ui';
import { useItemFormStore } from '../application/item-form-store';

export function ItemFormFields() {
  const draft = useItemFormStore((s) => s.draft);
  const errors = useItemFormStore((s) => s.errors);
  const mode = useItemFormStore((s) => s.mode);
  const setField = useItemFormStore((s) => s.setField);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setField('image', reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Item information
      </Typography>
      <Stack spacing={2}>
        <FormField
          name="name"
          label="Name"
          required
          value={draft.name}
          onChange={(e) => setField('name', e.target.value)}
          errorMessage={errors.name}
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
        <FormField
          name="description"
          label="Description"
          value={draft.description}
          onChange={(e) => setField('description', e.target.value)}
          errorMessage={errors.description}
          multiline
          minRows={2}
        />
        <FormField
          name="sku"
          label="SKU"
          value={draft.sku}
          onChange={(e) => setField('sku', e.target.value)}
          errorMessage={errors.sku}
          slotProps={{ htmlInput: { maxLength: 50, 'aria-label': 'SKU' } }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
          Leave empty to auto-generate
        </Typography>
        <Stack direction="row" spacing={2}>
          <FormField
            name="quantity"
            label="Quantity"
            type="number"
            value={draft.quantity}
            onChange={(e) => setField('quantity', Number(e.target.value))}
            errorMessage={errors.quantity}
            slotProps={{ htmlInput: { min: 0 } }}
            sx={{ flex: 1 }}
          />
          <FormField
            name="price"
            label="Price"
            type="number"
            value={draft.price}
            onChange={(e) => setField('price', Number(e.target.value))}
            errorMessage={errors.price}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            sx={{ flex: 1 }}
          />
        </Stack>
        <FormField
          name="tags"
          label="Tags"
          value={draft.tags}
          onChange={(e) => setField('tags', e.target.value)}
          errorMessage={errors.tags}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
          Comma-separated values
        </Typography>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            Image
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Button variant="outlined" size="small" onClick={() => fileRef.current?.click()}>
              {draft.image ? 'Change' : 'Upload'}
            </Button>
            {draft.image && (
              <Button size="small" color="error" onClick={() => setField('image', '')}>
                Remove
              </Button>
            )}
          </Stack>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          {draft.image && (
            <Avatar
              src={draft.image}
              variant="rounded"
              sx={{ width: 100, height: 100, mt: 1 }}
            />
          )}
        </Box>
        {mode === 'edit' && (
          <FormControlLabel
            control={
              <Switch
                checked={draft.is_active}
                onChange={(e) => setField('is_active', e.target.checked)}
              />
            }
            label="Active"
          />
        )}
      </Stack>
    </Box>
  );
}
