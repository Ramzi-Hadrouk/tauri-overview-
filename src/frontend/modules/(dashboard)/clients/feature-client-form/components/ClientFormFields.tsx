'use client';
import { Box, Stack, FormControlLabel, Switch, Typography } from '@mui/material';
import { FormField } from '@/frontend/shared/ui';
import { useClientFormStore } from '../application/client-form-store';

export function ClientFormFields() {
  const draft = useClientFormStore((s) => s.draft);
  const errors = useClientFormStore((s) => s.errors);
  const mode = useClientFormStore((s) => s.mode);
  const setField = useClientFormStore((s) => s.setField);

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Personal information
      </Typography>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormField
            name="firstName"
            label="First name"
            required
            value={draft.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            errorMessage={errors.firstName}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <FormField
            name="lastName"
            label="Last name"
            required
            value={draft.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            errorMessage={errors.lastName}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormField
            name="email"
            label="Email"
            type="email"
            value={draft.email}
            onChange={(e) => setField('email', e.target.value)}
            errorMessage={errors.email}
          />
          <FormField
            name="phone"
            label="Phone"
            value={draft.phone}
            onChange={(e) => setField('phone', e.target.value)}
            errorMessage={errors.phone}
          />
        </Stack>
        {mode === 'edit' && (
          <FormControlLabel
            control={
              <Switch
                checked={draft.archived}
                onChange={(e) => setField('archived', e.target.checked)}
              />
            }
            label="Archived"
          />
        )}
      </Stack>
    </Box>
  );
}
