// src/backend/shared/tauri/ipc-client.ts
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { logger } from '@/backend/core/tracing';

/**
 * Typed wrapper around Tauri's invoke().
 * Only module contracts may import this — not feature hooks, not components.
 */
export async function invoke<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const span = logger.startSpan(`ipc:${command}`);
  try {
    const result = await tauriInvoke<T>(command, args);
    span.end({ status: 'ok' });
    return result;
  } catch (err) {
    span.end({ status: 'error', error: String(err) });
    logger.category('ipc').error('ipc.command.failed', { command, error: err });
    throw err;
  }
}