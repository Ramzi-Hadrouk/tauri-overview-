'use client';
import { useCallback } from 'react';
import { useUiStore } from '@/frontend/store/ui-store';

export interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useConfirm() {
  const openConfirm = useUiStore((s) => s.openConfirm);
  const closeConfirm = useUiStore((s) => s.closeConfirm);

  const confirm = useCallback(
    (opts: ConfirmOptions) => {
      openConfirm({
        title: opts.title,
        message: opts.message,
        onConfirm: opts.onConfirm,
        onCancel: opts.onCancel,
      });
    },
    [openConfirm],
  );

  return { confirm, closeConfirm };
}
