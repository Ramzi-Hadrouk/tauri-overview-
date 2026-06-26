'use client';
import { Box } from '@mui/material';
import { Pagination } from '@/frontend/shared/ui';
import { useItemListStore } from '../application/item-list-store';

export interface ItemListPaginationProps {
  total: number;
}

export function ItemListPagination({ total }: ItemListPaginationProps) {
  const page = useItemListStore((s) => s.page);
  const size = useItemListStore((s) => s.size);
  const setPage = useItemListStore((s) => s.setPage);
  const setSize = useItemListStore((s) => s.setSize);

  return (
    <Box sx={{ borderTop: 1, borderColor: 'divider', py: 1, display: 'flex', justifyContent: 'flex-end' }}>
      <Pagination
        total={total}
        page={page - 1}
        rowsPerPage={size}
        onPageChange={(_e, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={(e) => setSize(parseInt(e.target.value, 10))}
      />
    </Box>
  );
}
