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
    const result = await tauriInvoke<IpcResponse<T>>(command, args);
    if (!result.success) {
      throw new IpcError('error', result.message || 'Request failed');
    }
    return result;
  } catch (raw) {
    if (raw instanceof IpcError) throw raw;
    const error = raw as AppError;
    throw new IpcError(
      error.code ?? 'unknown_error',
      error.message ?? 'An unexpected error occurred',
      error.field ?? undefined,
    );
  }
}
