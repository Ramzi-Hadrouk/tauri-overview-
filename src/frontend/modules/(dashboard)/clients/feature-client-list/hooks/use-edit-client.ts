'use client';
import { clientContract } from '@/backend/modules/(core-domain)/clients/contracts/client.contract';
import { useNotification } from '@/frontend/shared/hooks/useNotification';

export function useEditClient() {
  const { error } = useNotification();

  const openEdit = async (
    id: string,
    onLoaded: (data: Awaited<ReturnType<typeof clientContract.search>>['items'][number]) => void,
  ) => {
    try {
      const all = await clientContract.search({ page: 1, size: 100, sortBy: 'lastName', sortDir: 'asc' });
      const found = all.items.find((c) => c.id === id);
      if (!found) {
        error('Client not found');
        return;
      }
      onLoaded(found);
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
    }
  };

  return { openEdit };
}
