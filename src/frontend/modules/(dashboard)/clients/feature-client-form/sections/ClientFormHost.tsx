'use client';
import { ClientFormDialog } from '../components';

/**
 * Single-instance dialog host for the client form.
 * Mount once on a page; open via useClientFormStore.openForm(...).
 */
export function ClientFormHost() {
  return <ClientFormDialog />;
}
