import { create } from 'zustand';
import type { Item } from '@/frontend/shared/types/generated/Item';

export type ItemFormMode = 'create' | 'edit';

export interface ItemFormDraft {
  name: string;
  description: string;
  is_active: boolean;
}

export const EMPTY_DRAFT: ItemFormDraft = {
  name: '',
  description: '',
  is_active: true,
};

interface ItemFormState {
  mode: ItemFormMode;
  editingId: string | null;
  isOpen: boolean;
  draft: ItemFormDraft;
  errors: Partial<Record<keyof ItemFormDraft, string>>;
  isSubmitting: boolean;

  openForm: (init: { mode: ItemFormMode; editingId?: string; initial?: Item }) => void;
  closeForm: () => void;
  setField: <K extends keyof ItemFormDraft>(field: K, value: ItemFormDraft[K]) => void;
  setErrors: (errors: ItemFormState['errors']) => void;
  setSubmitting: (v: boolean) => void;
  reset: () => void;
}

export const useItemFormStore = create<ItemFormState>()((set) => ({
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
            name: initial.name,
            description: initial.description ?? '',
            is_active: initial.is_active,
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
