'use client';
import { Alert, AlertTitle, Box } from '@mui/material';

export function ClientErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="error">
        <AlertTitle>Failed to load clients</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
}
