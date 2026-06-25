'use client';
import { Box, Button, Stack, Switch, FormControlLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useClientListStore } from '../application/client-list-store';

export interface ClientListToolbarProps {
  onNewClient: () => void;
}

export function ClientListToolbar({ onNewClient }: ClientListToolbarProps) {
  const filters = useClientListStore((s) => s.filters);
  const setFilters = useClientListStore((s) => s.setFilters);

  const archivedOnly = filters.archived === true;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
      }}
      spacing={2}
    >
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={archivedOnly}
              onChange={(e) =>
                setFilters({
                  archived: e.target.checked ? true : undefined,
                  page: 1,
                })
              }
            />
          }
          label="Show archived only"
        />
      </Box>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onNewClient}>
        New Client
      </Button>
    </Stack>
  );
}
