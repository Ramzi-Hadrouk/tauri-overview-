'use client';
import { itemsCommands } from '@/frontend/core/ipc/contracts/items';
import { useItemListStore } from '../application/item-list-store';
import { useConfirm } from '@/frontend/core/hooks/useConfirm';
import { useNotification } from '@/frontend/core/hooks/useNotification';

export function useDeleteItem() {
  const setPage = useItemListStore((s) => s.setPage);
  const { confirm } = useConfirm();
  const { success, error } = useNotification();

  const requestDelete = (id: string, displayName: string) => {
    confirm({
      title: 'Delete item',
      message: `Are you sure you want to delete ${displayName}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await itemsCommands.deleteItem(id);
          setPage(1);
          success(`Item "${displayName}" deleted`);
        } catch (err) {
          error(err instanceof Error ? err.message : String(err));
        }
      },
    });
  };

  return { requestDelete };
}
