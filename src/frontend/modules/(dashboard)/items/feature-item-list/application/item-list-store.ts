import { create } from 'zustand';
import type { PaginatedData } from '@/frontend/shared/types/generated/PaginatedData';
import type { Item } from '@/frontend/shared/types/generated/Item';

interface ItemListState {
  page: number;
  size: number;
  results: PaginatedData<Item> | null;
  isFetching: boolean;
  lastError: string | null;

  setPage: (page: number) => void;
  setSize: (size: number) => void;
  setResults: (items: PaginatedData<Item> | null) => void;
  setFetching: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useItemListStore = create<ItemListState>((set) => ({
  page: 1,
  size: 20,
  results: null,
  isFetching: false,
  lastError: null,

  setPage: (page) => set({ page }),
  setSize: (size) => set({ size, page: 1 }),
  setResults: (items) => set({ results: items }),
  setFetching: (v) => set({ isFetching: v }),
  setError: (e) => set({ lastError: e }),
}));
