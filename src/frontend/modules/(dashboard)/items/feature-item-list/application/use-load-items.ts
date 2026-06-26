import { useEffect } from 'react';
import { itemsCommands } from '@/frontend/core/ipc/contracts/items';
import { useItemListStore } from './item-list-store';

export function useLoadItems() {
  const page = useItemListStore((s) => s.page);
  const size = useItemListStore((s) => s.size);
  const refreshKey = useItemListStore((s) => s.refreshKey);
  const setResults = useItemListStore((s) => s.setResults);
  const setFetching = useItemListStore((s) => s.setFetching);
  const setError = useItemListStore((s) => s.setError);
  const results = useItemListStore((s) => s.results);
  const isFetching = useItemListStore((s) => s.isFetching);
  const lastError = useItemListStore((s) => s.lastError);

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
  }, [page, size, refreshKey, setResults, setFetching, setError]);

  return { items: results, isFetching, lastError };
}
