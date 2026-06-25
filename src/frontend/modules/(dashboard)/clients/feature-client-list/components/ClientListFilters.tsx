'use client';
import { Stack, MenuItem, TextField } from '@mui/material';
import { useClientListStore } from '../application/client-list-store';
import type { ClientFilters } from '@/domain/clients/client-filters.dto';

const SORT_OPTIONS: Array<{ value: `${ClientFilters['sortBy']}:${ClientFilters['sortDir']}`; label: string }> = [
  { value: 'lastName:asc', label: 'Last name (A → Z)' },
  { value: 'lastName:desc', label: 'Last name (Z → A)' },
  { value: 'createdAt:asc', label: 'Created (oldest first)' },
  { value: 'createdAt:desc', label: 'Created (newest first)' },
];

export function ClientListFilters() {
  const filters = useClientListStore((s) => s.filters);
  const setFilters = useClientListStore((s) => s.setFilters);

  const current: `${ClientFilters['sortBy']}:${ClientFilters['sortDir']}` = `${filters.sortBy}:${filters.sortDir}`;

  return (
    <Stack direction="row" sx={{ alignItems: 'center' }} spacing={2}>
      <TextField
        select
        size="small"
        label="Sort by"
        value={current}
        onChange={(e) => {
          const [sortBy, sortDir] = e.target.value.split(':') as [
            ClientFilters['sortBy'],
            ClientFilters['sortDir'],
          ];
          setFilters({ sortBy, sortDir, page: 1 });
        }}
        sx={{ minWidth: 220 }}
      >
        {SORT_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
