'use client';
import { Box } from '@mui/material';
import { SearchBar } from '@/frontend/shared/ui';
import { useClientListStore } from '../application/client-list-store';

export function ClientSearchBar() {
  const filters = useClientListStore((s) => s.filters);
  const setFilters = useClientListStore((s) => s.setFilters);

  return (
    <Box sx={{ maxWidth: 360 }}>
      <SearchBar
        value={filters.query ?? ''}
        onChange={(v) => setFilters({ query: v || undefined, page: 1 })}
        placeholder="Search by name, email, phone…"
      />
    </Box>
  );
}
