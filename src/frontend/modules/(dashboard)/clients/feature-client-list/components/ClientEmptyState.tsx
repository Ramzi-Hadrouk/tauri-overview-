'use client';
import { EmptyState } from '@/frontend/shared/ui';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export interface ClientEmptyStateProps {
  onNewClient: () => void;
  hasFilters: boolean;
}

export function ClientEmptyState({ onNewClient, hasFilters }: ClientEmptyStateProps) {
  return (
    <EmptyState
      title={hasFilters ? 'No clients match your filters' : 'No clients yet'}
      description={
        hasFilters
          ? 'Try adjusting the search or clearing filters.'
          : 'Add your first client to get started.'
      }
      icon={<PersonAddIcon fontSize="inherit" />}
      action={
        hasFilters
          ? undefined
          : { label: 'New Client', onClick: onNewClient }
      }
    />
  );
}
