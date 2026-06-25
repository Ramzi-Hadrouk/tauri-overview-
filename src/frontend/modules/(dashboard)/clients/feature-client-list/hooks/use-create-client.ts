'use client';
import { useNotification } from '@/frontend/shared/hooks/useNotification';

export function useCreateClient() {
  const { error } = useNotification();

  const openCreate = (onOpen: () => void) => {
    try {
      onOpen();
    } catch (err) {
      error(err instanceof Error ? err.message : String(err));
    }
  };

  return { openCreate };
}
