import { create } from 'zustand';
import type { Item } from '@/frontend/shared/types/generated/Item';

export type ItemFormMode = 'create' | 'edit';

export interface ItemFormDraft {
  name: string;
  description: string;
  sku: string;
  quantity: number;
  price: number;
  tags: string;
  image: string | null;
  is_active: boolean;
}

export const EMPTY_DRAFT: ItemFormDraft = {
  name: '',
  description: '',
  sku: '',
  quantity: 0,
  price: 0,
  tags: '',
  image: null,
  is_active: true,
};

interface ItemFormState {
  mode: ItemFormMode;
  editingId: string | null;
  isOpen: boolean;
  draft: ItemFormDraft;
  errors: Partial<Record<keyof ItemFormDraft, string>>;
  isSubmitting: boolean;
  formKey: number;

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
  formKey: 0,

  openForm: ({ mode, editingId, initial }) =>
    set((s) => ({
      mode,
      editingId: editingId ?? null,
      isOpen: true,
      draft: initial
        ? {
            name: initial.name,
            description: initial.description ?? '',
            sku: initial.sku,
            quantity: Number(initial.quantity),
            price: Number(initial.price),
            tags: initial.tags,
            image: null,
            is_active: initial.is_active,
          }
        : EMPTY_DRAFT,
      errors: {},
      isSubmitting: false,
      formKey: s.formKey + 1,
    })),

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
