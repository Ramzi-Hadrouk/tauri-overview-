import { isDev } from '@/domain/config/env';

let tauriInvokeLog: ((entry: unknown) => Promise<unknown>) | null | undefined;

async function resolveLogWriter() {
  if (tauriInvokeLog !== undefined) return tauriInvokeLog;
  try {
    const api = await import('@tauri-apps/api/core');
    tauriInvokeLog = (entry: unknown) => api.invoke('write_log', { entry });
  } catch {
    tauriInvokeLog = null;
  }
  return tauriInvokeLog;
}

function ts() { return new Date().toISOString(); }

function devLog(level: string, message: string, data?: Record<string, unknown>) {
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`[${ts()}] ${level.toUpperCase()} ${message}`, data ?? '');
}

function prodLog(level: string, message: string, data?: Record<string, unknown>) {
  resolveLogWriter().then((write) => {
    if (write) {
      write({ ts: ts(), level, message, ...data });
    } else {
      devLog(level, message, data);
    }
  });
}

function emit(level: string, message: string, data?: Record<string, unknown>) {
  if (isDev) { devLog(level, message, data); return; }
  prodLog(level, message, data);
}

export const logger = {
  debug: (m: string, d?: Record<string, unknown>) => emit('debug', m, d),
  info: (m: string, d?: Record<string, unknown>) => emit('info', m, d),
  warn: (m: string, d?: Record<string, unknown>) => emit('warn', m, d),
  error: (m: string, d?: Record<string, unknown>) => emit('error', m, d),
};
