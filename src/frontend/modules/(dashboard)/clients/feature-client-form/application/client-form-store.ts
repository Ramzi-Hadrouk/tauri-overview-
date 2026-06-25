import { create } from 'zustand';
import type { Client } from '@/domain/clients/entities';

export type ClientFormMode = 'create' | 'edit';

export interface ClientFormDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  archived: boolean;
}

export const EMPTY_DRAFT: ClientFormDraft = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  archived: false,
};

interface ClientFormState {
  mode: ClientFormMode;
  editingId: string | null;
  isOpen: boolean;
  draft: ClientFormDraft;
  errors: Partial<Record<keyof ClientFormDraft, string>>;
  isSubmitting: boolean;

  openForm: (init: { mode: ClientFormMode; editingId?: string; initial?: Client }) => void;
  closeForm: () => void;
  setField: <K extends keyof ClientFormDraft>(field: K, value: ClientFormDraft[K]) => void;
  setErrors: (errors: ClientFormState['errors']) => void;
  setSubmitting: (v: boolean) => void;
  reset: () => void;
}

export const useClientFormStore = create<ClientFormState>()((set) => ({
  mode: 'create',
  editingId: null,
  isOpen: false,
  draft: EMPTY_DRAFT,
  errors: {},
  isSubmitting: false,

  openForm: ({ mode, editingId, initial }) =>
    set({
      mode,
      editingId: editingId ?? null,
      isOpen: true,
      draft: initial
        ? {
            firstName: initial.firstName,
            lastName: initial.lastName,
            phone: initial.phone ?? '',
            email: initial.email ?? '',
            archived: initial.archived,
          }
        : EMPTY_DRAFT,
      errors: {},
      isSubmitting: false,
    }),

  closeForm: () => set({ isOpen: false }),

  setField: (field, value) =>
    set((s) => ({
      draft: { ...s.draft, [field]: value },
      errors: { ...s.errors, [field]: undefined },
    })),

  setErrors: (errors) => set({ errors }),
  setSubmitting: (v) => set({ isSubmitting: v }),
  reset: () =>
    set({
      mode: 'create',
      editingId: null,
      isOpen: false,
      draft: EMPTY_DRAFT,
      errors: {},
      isSubmitting: false,
    }),
}));
