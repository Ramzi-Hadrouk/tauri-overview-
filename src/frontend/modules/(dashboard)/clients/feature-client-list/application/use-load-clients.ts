// src/frontend/modules/(dashboard)/clients/feature-client-list/application/use-load-clients.ts
import { useEffect } from 'react';
import { clientContract } from '@/backend/modules/(core-domain)/clients/contracts/client.contract';
import { useClientListStore } from './client-list-store';

export function useLoadClients() {
  const { filters, setCachedItems, setFetching, setError, cachedItems, isFetching, lastError } =
    useClientListStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetching(true);
      setError(null);
      try {
        const result = await clientContract.search(filters);
        if (!cancelled) setCachedItems(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filters, setCachedItems, setFetching, setError]);

  return { items: cachedItems, isFetching, lastError };
}