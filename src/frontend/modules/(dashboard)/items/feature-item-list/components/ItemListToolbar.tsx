'use client';
import { Box, Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export interface ItemListToolbarProps {
  onNewItem: () => void;
}

export function ItemListToolbar({ onNewItem }: ItemListToolbarProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
      }}
      spacing={2}
    >
      <Box />
      <Button variant="contained" startIcon={<AddIcon />} onClick={onNewItem}>
        New Item
      </Button>
    </Stack>
  );
}
