import { isDev } from '@/backend/config/env';

function ts() { return new Date().toISOString(); }

function devLog(level: string, message: string, data?: Record<string, unknown>) {
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`[${ts()}] ${level.toUpperCase()} ${message}`, data ?? '');
}

function prodLog(level: string, message: string, data?: Record<string, unknown>) {
  import('@tauri-apps/api/core').then(
    ({ invoke }) => invoke('write_log', { entry: { ts: ts(), level, message, ...data } }),
    () => devLog(level, message, data),
  );
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
