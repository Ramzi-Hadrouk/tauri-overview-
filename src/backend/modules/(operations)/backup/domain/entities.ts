// src/backend/modules/(operations)/backup/domain/entities.ts
export interface BackupResult {
  path: string;
  size: number;
}

export interface RestoreResult {
  success: boolean;
}