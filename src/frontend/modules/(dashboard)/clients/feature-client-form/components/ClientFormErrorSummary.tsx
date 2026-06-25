'use client';
import { Alert, Box, Typography } from '@mui/material';
import { useClientFormStore } from '../application/client-form-store';

export function ClientFormErrorSummary() {
  const errors = useClientFormStore((s) => s.errors);
  const messages = Object.values(errors).filter(Boolean) as string[];

  if (messages.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="error">
        Please fix the following:
        <Box component="ul" sx={{ m: '4px 0 0 16px', p: 0 }}>
          {messages.map((m) => (
            <Typography key={m} component="li" variant="body2">{m}</Typography>
          ))}
        </Box>
      </Alert>
    </Box>
  );
}
