import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type { IpcResponse } from '@/frontend/shared/types/generated/IpcResponse';
import type { AppError } from '@/frontend/shared/types/generated/AppError';

export class IpcError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'IpcError';
  }
}

export async function invoke<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<IpcResponse<T>> {
  try {
    return await tauriInvoke<IpcResponse<T>>(command, args);
  } catch (raw) {
    const error = raw as AppError;
    throw new IpcError(
      error.code ?? 'unknown_error',
      error.message ?? 'An unexpected error occurred',
      error.field ?? undefined,
    );
  }
}
