'use client';
import { clientContract } from '@/backend/modules/(core-domain)/clients/contracts/client.contract';
import { useNotification } from '@/frontend/shared/hooks/useNotification';
import { useClientFormStore } from '../application/client-form-store';
import type { Client } from '@/backend/modules/(core-domain)/clients/domain/entities';

export function useClientFormInit() {
  const openForm = useClientFormStore((s) => s.openForm);
  const { error } = useNotification();

  const openCreate = () => openForm({ mode: 'create' });

  const openEditById = async (id: string) => {
    try {
      const result = await clientContract.search({
        page: 1,
        size: 100,
        sortBy: 'lastName',
        sortDir: 'asc',
      });
      const found: Client | undefined = result.items.find((c) => c.id === id);
      if (!found) {
        error('Client not found');
        return;
      }
      openForm({ mode: 'edit', editingId: id, initial: found });
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
    }
  };

  return { openCreate, openEditById };
}
