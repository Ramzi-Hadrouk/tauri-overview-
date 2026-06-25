'use client';
import { useMemo } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useLoadClients } from '../application/use-load-clients';
import { useClientListStore } from '../application/client-list-store';
import {
  ClientErrorAlert,
  ClientListFilters,
  ClientListPagination,
  ClientListToolbar,
  ClientSearchBar,
  ClientTable,
  ClientEmptyState,
} from '../components';
import { useDeleteClient } from '../hooks/use-delete-client';
import { useClientFormStore } from '../../feature-client-form/application/client-form-store';
import { getClientFullName } from '@/frontend/shared/utils/client-display';

export function ClientListSection() {
  const { items, isFetching, lastError } = useLoadClients();
  const filters = useClientListStore((s) => s.filters);
  const { requestDelete } = useDeleteClient();
  const openForm = useClientFormStore((s) => s.openForm);

  const clients = items?.items ?? [];
  const hasFilters = Boolean(
    (filters.query && filters.query.length > 0) || filters.archived !== undefined,
  );

  const handleDelete = (id: string) => {
    const target = clients.find((c) => c.id === id);
    requestDelete(id, target ? getClientFullName(target) : 'this client');
  };

  const handleEdit = (id: string) => {
    const target = clients.find((c) => c.id === id);
    if (!target) return;
    openForm({ mode: 'edit', editingId: id, initial: target });
  };

  const totalLabel = useMemo(() => {
    if (!items) return null;
    if (items.total === 0) return '0 clients';
    if (items.total === 1) return '1 client';
    return `${items.total} clients`;
  }, [items]);

  return (
    <Stack spacing={2}>
      <ClientListToolbar onNewClient={() => openForm({ mode: 'create' })} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'center' } }}
      >
        <ClientSearchBar />
        <ClientListFilters />
        <Box sx={{ flexGrow: 1 }} />
        {totalLabel && <Typography variant="body2" color="text.secondary">{totalLabel}</Typography>}
      </Stack>

      <ClientErrorAlert message={lastError} />

      {isFetching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : clients.length === 0 ? (
        <ClientEmptyState onNewClient={() => openForm({ mode: 'create' })} hasFilters={hasFilters} />
      ) : (
        <>
          <ClientTable items={clients} onEdit={handleEdit} onDelete={handleDelete} />
          <ClientListPagination />
        </>
      )}
    </Stack>
  );
}
