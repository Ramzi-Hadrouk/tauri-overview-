// src/frontend/modules/(dashboard)/clients/feature-client-list/sections/ClientListSection.tsx
'use client';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useLoadClients } from '../application/use-load-clients';

export function ClientListSection() {
  const { items, isFetching, lastError } = useLoadClients();

  return (
    <Box>
      {lastError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {lastError}
        </Alert>
      )}
      
      {isFetching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : items ? (
        <Box>
          <p>Total clients: {items.total}</p>
          {/* Client list will be implemented here */}
        </Box>
      ) : null}
    </Box>
  );
}