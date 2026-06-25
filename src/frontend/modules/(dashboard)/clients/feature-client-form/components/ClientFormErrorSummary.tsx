'use client';
import { Alert, Box } from '@mui/material';
import { useClientFormStore } from '../application/client-form-store';

export function ClientFormErrorSummary() {
  const errors = useClientFormStore((s) => s.errors);
  const messages = Object.values(errors).filter(Boolean) as string[];

  if (messages.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="error">
        Please fix the following:
        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Alert>
    </Box>
  );
}
