'use client';
import { itemsCommands } from '@/frontend/core/ipc/contracts/items';
import { useItemFormStore } from './item-form-store';
import { useNotification } from '@/frontend/core/hooks/useNotification';
import { useItemListStore } from '../../feature-item-list/application/item-list-store';

export function useItemForm() {
  const store = useItemFormStore();
  const setPage = useItemListStore((s) => s.setPage);
  const { success, error: notifyError } = useNotification();

  const submit = async () => {
    const errors: Partial<Record<keyof typeof store.draft, string>> = {};
    if (!store.draft.name.trim()) {
      errors.name = 'Name is required';
    }
    if (Object.keys(errors).length > 0) {
      store.setErrors(errors);
      return false;
    }

    store.setErrors({});
    store.setSubmitting(true);
    try {
      if (store.mode === 'create') {
        const created = await itemsCommands.createItem({
          name: store.draft.name.trim(),
          description: store.draft.description.trim() || null,
        });
        if (created.data) success(`Item "${created.data.name}" created`);
      } else if (store.editingId) {
        const updated = await itemsCommands.updateItem(store.editingId, {
          name: store.draft.name.trim() || null,
          description: store.draft.description.trim() || null,
          is_active: store.draft.is_active,
        });
        if (updated.data) success(`Item "${updated.data.name}" updated`);
      }

      setPage(1);
      store.closeForm();
      return true;
    } catch (err) {
      notifyError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      store.setSubmitting(false);
    }
  };

  return { submit };
}
