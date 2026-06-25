'use client';
import { clientContract } from '@/backend/modules/(core-domain)/clients/contracts/client.contract';
import { useClientFormStore } from '../application/client-form-store';
import { useNotification } from '@/frontend/shared/hooks/useNotification';
import { validateClientForm } from '../hooks/use-client-form-validation';
import { useClientListStore } from '../../feature-client-list/application/client-list-store';
import { getClientFullName } from '@/frontend/shared/utils/client-display';

export function useClientForm() {
  const store = useClientFormStore();
  const setFilters = useClientListStore((s) => s.setFilters);
  const { success, error: notifyError } = useNotification();

  const submit = async () => {
    const errors = validateClientForm(store.draft);
    if (Object.keys(errors).length > 0) {
      store.setErrors(errors);
      return false;
    }

    store.setErrors({});
    store.setSubmitting(true);
    try {
      const trimmed = {
        firstName: store.draft.firstName.trim(),
        lastName: store.draft.lastName.trim(),
        phone: store.draft.phone.trim() || undefined,
        email: store.draft.email.trim() || undefined,
      };

      if (store.mode === 'create') {
        const created = await clientContract.create(trimmed);
        success(`Client "${getClientFullName(created)}" created`);
      } else if (store.editingId) {
        const updated = await clientContract.update(store.editingId, {
          ...trimmed,
          archived: store.draft.archived,
        });
        success(`Client "${getClientFullName(updated)}" updated`);
      }

      setFilters({ page: 1 });
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
