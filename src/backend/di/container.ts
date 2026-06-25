// src/backend/di/container.ts
import { DrizzleClientRepository } from '@/backend/modules/(core-domain)/clients/repositories/drizzle-client.repository';
import { CreateClientService }  from '@/backend/modules/(core-domain)/clients/services/create-client.service';
import { UpdateClientService }  from '@/backend/modules/(core-domain)/clients/services/update-client.service';
import { DeleteClientService }  from '@/backend/modules/(core-domain)/clients/services/delete-client.service';
import { SearchClientsService } from '@/backend/modules/(core-domain)/clients/services/search-clients.service';
import { CreateBackupService }  from '@/backend/modules/(operations)/backup/services/create-backup.service';
import { RestoreBackupService } from '@/backend/modules/(operations)/backup/services/restore-backup.service';

// Single shared repository instance — all services for the same entity share it.
const clientRepo = new DrizzleClientRepository();

export const container = {
  createClientService:  new CreateClientService(clientRepo),
  updateClientService:  new UpdateClientService(clientRepo),
  deleteClientService:  new DeleteClientService(clientRepo),
  searchClientsService: new SearchClientsService(clientRepo),
  createBackupService:  new CreateBackupService(),
  restoreBackupService: new RestoreBackupService(),
} as const;

export type Container = typeof container;