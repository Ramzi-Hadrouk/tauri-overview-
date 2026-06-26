'use client';
import { EmptyState } from '@/frontend/shared/ui';
import Inventory2Icon from '@mui/icons-material/Inventory2';

export interface ItemEmptyStateProps {
  onNewItem: () => void;
}

export function ItemEmptyState({ onNewItem }: ItemEmptyStateProps) {
  return (
    <EmptyState
      title="No items yet"
      description="Add your first item to get started."
      icon={<Inventory2Icon fontSize="inherit" />}
      action={{ label: 'New Item', onClick: onNewItem }}
    />
  );
}
