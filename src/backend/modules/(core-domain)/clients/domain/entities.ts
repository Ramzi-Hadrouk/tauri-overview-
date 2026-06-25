// src/backend/modules/(core-domain)/clients/domain/entities.ts
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientCreateData {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

export interface ClientUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  archived?: boolean;
}