// src/backend/di/container.ts
import { DrizzleClientRepository } from '@/backend/modules/(core-domain)/clients/repositories/drizzle-client.repository';
import { CreateClientService }  from '@/backend/modules/(core-domain)/clients/services/create-client.service';
import { UpdateClientService }  from '@/backend/modules/(core-domain)/clients/services/update-client.service';
import { DeleteClientService }  from '@/backend/modules/(core-domain)/clients/services/delete-client.service';
import { SearchClientsService } from '@/backend/modules/(core-domain)/clients/services/search-clients.service';
import { CreateBackupService }  from '@/backend/modules/(operations)/backup/services/create-backup.service';
import { RestoreBackupService } from '@/backend/modules/(operations)/backup/services/restore-backup.service';
import { backupContract } from '@/backend/modules/(operations)/backup/contracts/backup.contract';

// Single shared repository instance — all services for the same entity share it.
const clientRepo = new DrizzleClientRepository();

/** Mutable backing store that `override()` can replace. */
const store = {
  createClientService:  new CreateClientService(clientRepo),
  updateClientService:  new UpdateClientService(clientRepo),
  deleteClientService:  new DeleteClientService(clientRepo),
  searchClientsService: new SearchClientsService(clientRepo),
  createBackupService:  new CreateBackupService(backupContract),
  restoreBackupService: new RestoreBackupService(backupContract),
};

/** Read-only view of the service container. Consumed by `service-invoker`. */
export const container: {
  readonly [K in keyof typeof store]: (typeof store)[K];
} = store;

export type Container = typeof container;

/**
 * Override a service instance (e.g. with a fake for tests).
 */
export function override<K extends keyof typeof store>(
  key: K,
  service: (typeof store)[K],
): void {
  store[key] = service;
}
