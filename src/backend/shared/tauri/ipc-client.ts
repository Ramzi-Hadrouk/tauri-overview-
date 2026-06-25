// src/backend/shared/tauri/ipc-client.ts
import { logger } from '@/backend/core/tracing';
import { ApplicationError } from '@/backend/core/exceptions';

/**
 * Structured error crossing the TS/Rust IPC boundary.
 *
 * Mirrors the Rust `AppError` (internally-tagged: `{ kind, message }`). Rust
 * commands that return `Result<_, String>` map to `kind = "Unknown"`.
 */
export interface IpcError {
  kind: string;
  message: string;
}

/**
 * Maps a thrown Tauri rejection into a typed IpcError. Accepts:
 *  - structured { kind, message } (from Rust AppError),
 *  - plain strings (from Rust commands returning Result<_, String>),
 *  - anything else (serialized to a string).
 */
export function toIpcError(err: unknown): IpcError {
  if (err !== null && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (typeof e.kind === 'string' && typeof e.message === 'string') {
      return { kind: e.kind, message: e.message };
    }
    // Tauri sometimes wraps rejections in { message } or an Error.
    if (typeof e.message === 'string') {
      return { kind: 'Unknown', message: e.message };
    }
  }
  if (typeof err === 'string') {
    return { kind: 'Unknown', message: err };
  }
  return { kind: 'Unknown', message: String(err) };
}

/** True when running inside a Tauri webview (IPC is available). */
export function isTauriRuntime(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    // @ts-expect-error – internal Tauri global injected into the webview
    (globalThis.__TAURI_INTERNALS__ !== undefined ||
      // @ts-expect-error – legacy global
      globalThis.__TAURI__ !== undefined)
  );
}

let tauriInvokeFn:
  | ((command: string, args?: Record<string, unknown>) => Promise<unknown>)
  | null
  | undefined;

async function resolveInvoke(): Promise<typeof tauriInvokeFn> {
  if (tauriInvokeFn !== undefined) return tauriInvokeFn;
  if (!isTauriRuntime()) {
    tauriInvokeFn = null;
    return null;
  }
  const api = await import('@tauri-apps/api/core');
  tauriInvokeFn = api.invoke;
  return tauriInvokeFn;
}

/**
 * Typed description of a Tauri command: its argument shape and its success
 * result type. Kept in sync by hand with the Rust `#[tauri::command]` fns —
 * a rename on either side must be reflected here or calls fail to compile.
 */
export interface CommandMap {
  create_backup: { args: { dbPath: string; targetPath: string }; result: string };
  restore_backup: { args: { backupPath: string; targetPath: string }; result: null };
  verify_backup: { args: { path: string }; result: boolean };
  get_db_path: { args: Record<string, never>; result: string };
  get_db_size: { args: Record<string, never>; result: number };
  write_log: { args: { entry: unknown }; result: null };
}

export type CommandName = keyof CommandMap;

/**
 * Typed wrapper around Tauri's invoke(). Only module contracts may import this
 * — not feature hooks, not components.
 *
 * Rejections are normalized into ApplicationError (code IPC_ERROR) so the error
 * model matches the in-process service-invoker path.
 */
export async function invoke<K extends CommandName>(
  command: K,
  args: CommandMap[K]['args'],
): Promise<CommandMap[K]['result']> {
  const span = logger.startSpan(`ipc:${command}`);
  const invokeImpl = await resolveInvoke();
  if (!invokeImpl) {
    span.end({ status: 'error', error: 'not in Tauri runtime' });
    throw new ApplicationError(
      'IPC_UNAVAILABLE',
      `Cannot invoke "${command}": not running inside Tauri.`,
    );
  }
  try {
    const result = await invokeImpl(command, args);
    span.end({ status: 'ok' });
    return result as CommandMap[K]['result'];
  } catch (err) {
    const ipcErr = toIpcError(err);
    span.end({ status: 'error', error: ipcErr.message });
    logger.category('ipc').error('ipc.command.failed', { command, error: ipcErr });
    throw new ApplicationError(`IPC_${ipcErr.kind.toUpperCase()}`, ipcErr.message, { command });
  }
}
