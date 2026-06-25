'use client';
import { useClientFormStore } from '../application/client-form-store';

export function useResetClientForm() {
  const reset = useClientFormStore((s) => s.reset);
  return reset;
}
