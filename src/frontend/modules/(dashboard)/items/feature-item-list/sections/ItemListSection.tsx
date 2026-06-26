'use client';
import { useMemo } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useLoadItems } from '../application/use-load-items';
import {
  ItemErrorAlert,
  ItemListPagination,
  ItemListToolbar,
  ItemTable,
  ItemEmptyState,
} from '../components';
import { useDeleteItem } from '../hooks/use-delete-item';
import { useItemFormStore } from '../../feature-item-form/application/item-form-store';

export function ItemListSection() {
  const { items, isFetching, lastError } = useLoadItems();
  const { requestDelete } = useDeleteItem();
  const openForm = useItemFormStore((s) => s.openForm);

  const itemList = items?.items ?? [];

  const handleDelete = (id: string) => {
    const target = itemList.find((c) => c.id === id);
    requestDelete(id, target ? target.name : 'this item');
  };

  const handleEdit = (id: string) => {
    const target = itemList.find((c) => c.id === id);
    if (!target) return;
    openForm({ mode: 'edit', editingId: id, initial: target });
  };

  const totalLabel = useMemo(() => {
    if (!items) return null;
    if (items.total === 0) return '0 items';
    if (items.total === 1) return '1 item';
    return `${items.total} items`;
  }, [items]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ItemListToolbar onNewItem={() => openForm({ mode: 'create' })} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'center' } }}
      >
        {totalLabel && <Typography variant="body2" color="text.secondary">{totalLabel}</Typography>}
      </Stack>

      <ItemErrorAlert message={lastError} />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isFetching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : itemList.length === 0 ? (
          <ItemEmptyState onNewItem={() => openForm({ mode: 'create' })} />
        ) : (
          <ItemTable items={itemList} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </Box>

      {items && <ItemListPagination total={items.total} />}
    </Box>
  );
}
