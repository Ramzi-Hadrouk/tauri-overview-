// src/frontend/modules/(dashboard)/clients/feature-client-list/application/client-list-store.ts
import { create } from 'zustand';
import type { ClientFilters } from '@/backend/modules/(core-domain)/clients/dto/client-filters.dto';
import type { PaginatedResult } from '@/backend/core/pagination';
import type { Client } from '@/backend/modules/(core-domain)/clients/domain/entities';

interface ClientListState {
  // Feature-owned UI state
  filters: ClientFilters;
  selectedClientId: string | null;
  listDrawerOpen: boolean;
  // Cached server result — re-fetched when filters change
  cachedItems: PaginatedResult<Client> | null;
  isFetching: boolean;
  lastError: string | null;

  setFilters: (patch: Partial<ClientFilters>) => void;
  setSelectedClient: (id: string | null) => void;
  setListDrawerOpen: (open: boolean) => void;
  setCachedItems: (items: PaginatedResult<Client> | null) => void;
  setFetching: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useClientListStore = create<ClientListState>((set) => ({
  filters: { page: 1, size: 20, sortBy: 'lastName', sortDir: 'asc' },
  selectedClientId: null,
  listDrawerOpen: false,
  cachedItems: null,
  isFetching: false,
  lastError: null,

  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setSelectedClient: (id) => set({ selectedClientId: id }),
  setListDrawerOpen: (open) => set({ listDrawerOpen: open }),
  setCachedItems: (items) => set({ cachedItems: items }),
  setFetching: (v) => set({ isFetching: v }),
  setError: (e) => set({ lastError: e }),
}));