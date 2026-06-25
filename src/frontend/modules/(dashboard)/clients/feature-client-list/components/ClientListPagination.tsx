'use client';
import { Box } from '@mui/material';
import { Pagination } from '@/frontend/shared/ui';
import { useClientListStore } from '../application/client-list-store';

export function ClientListPagination() {
  const filters = useClientListStore((s) => s.filters);
  const setFilters = useClientListStore((s) => s.setFilters);

  const total = filters.page * filters.size;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Pagination
        total={total}
        page={filters.page - 1}
        rowsPerPage={filters.size}
        onPageChange={(_e, newPage) => setFilters({ page: newPage + 1 })}
        onRowsPerPageChange={(e) =>
          setFilters({ size: parseInt(e.target.value, 10), page: 1 })
        }
      />
    </Box>
  );
}
