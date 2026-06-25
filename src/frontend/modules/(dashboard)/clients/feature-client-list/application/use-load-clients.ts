// src/frontend/modules/(dashboard)/clients/feature-client-list/application/use-load-clients.ts
import { useEffect } from 'react';
import { clientContract } from '@/domain/clients/contract';
import { useClientListStore } from './client-list-store';

export function useLoadClients() {
  const { filters, setResults, setFetching, setError, results, isFetching, lastError } =
    useClientListStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetching(true);
      setError(null);
      try {
        const result = await clientContract.search(filters);
        if (!cancelled) setResults(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filters, setResults, setFetching, setError]);

  return { items: results, isFetching, lastError };
}