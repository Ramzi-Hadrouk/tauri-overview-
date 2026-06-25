// src/frontend/store/ui-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface ConfirmState {
  open: boolean; title: string; message: string;
  onConfirm?: () => void; onCancel?: () => void;
}

interface UiState {
  themeMode: 'light' | 'dark';
  drawerOpen: boolean;
  globalLoading: boolean;
  notifications: Notification[];
  confirm: ConfirmState;

  toggleTheme: () => void;
  setDrawerOpen: (open: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  pushNotification: (n: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  openConfirm: (state: Omit<ConfirmState, 'open'>) => void;
  closeConfirm: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      drawerOpen: false,
      globalLoading: false,
      notifications: [],
      confirm: { open: false, title: '', message: '' },

      toggleTheme: () => set((s) => ({ themeMode: s.themeMode === 'light' ? 'dark' : 'light' })),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
      pushNotification: (n) =>
        set((s) => ({ notifications: [...s.notifications, { ...n, id: crypto.randomUUID() }] })),
      dismissNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      openConfirm:  (state) => set({ confirm: { ...state, open: true } }),
      closeConfirm: () => set({ confirm: { open: false, title: '', message: '' } }),
    }),
    { name: 'ui-preferences', partialize: (s) => ({ themeMode: s.themeMode }) }
  )
);