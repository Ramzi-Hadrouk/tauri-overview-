import { useEffect } from 'react';
import { itemsCommands } from '@/frontend/core/ipc/contracts/items';
import { useItemListStore } from './item-list-store';

export function useLoadItems() {
  const { page, size, setResults, setFetching, setError, results, isFetching, lastError } =
    useItemListStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetching(true);
      setError(null);
      try {
        const result = await itemsCommands.listItems(page, size);
        if (!cancelled && result.data) setResults(result.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, size, setResults, setFetching, setError]);

  return { items: results, isFetching, lastError };
}
