'use client';
import { Box, Stack, FormControlLabel, Switch, Typography } from '@mui/material';
import { FormField } from '@/frontend/shared/ui';
import { useItemFormStore } from '../application/item-form-store';

export function ItemFormFields() {
  const draft = useItemFormStore((s) => s.draft);
  const errors = useItemFormStore((s) => s.errors);
  const mode = useItemFormStore((s) => s.mode);
  const setField = useItemFormStore((s) => s.setField);

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
