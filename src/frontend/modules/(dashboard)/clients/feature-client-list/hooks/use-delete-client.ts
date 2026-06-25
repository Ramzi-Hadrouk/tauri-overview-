'use client';
import { clientContract } from '@/domain/clients/contract';
import { useClientListStore } from '../application/client-list-store';
import { useConfirm } from '@/frontend/shared/hooks/useConfirm';
import { useNotification } from '@/frontend/shared/hooks/useNotification';

export function useDeleteClient() {
  const setFilters = useClientListStore((s) => s.setFilters);
  const { confirm } = useConfirm();
  const { success, error } = useNotification();

  const requestDelete = (id: string, displayName: string) => {
    confirm({
      title: 'Delete client',
      message: `Are you sure you want to delete ${displayName}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await clientContract.delete(id);
          setFilters({ page: 1 });
          success(`Client "${displayName}" deleted`);
        } catch (err) {
          error(err instanceof Error ? err.message : String(err));
        }
      },
    });
  };

  return { requestDelete };
}
