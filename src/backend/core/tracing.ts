// src/backend/core/tracing.ts
import { isDev } from '@/backend/config/env';

type LogLevel = "debug" | "info" | "warn" | "error";
type LogCategory =
  | "application"
  | "database"
  | "backup"
  | "migration"
  | "ipc"
  | "ui";

interface LogEntry {
  ts: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  payload?: Record<string, unknown>;
  spanId?: string;
}

/**
 * Lazily-resolved Tauri invoke, guarded so this module is safe to import in
 * non-Tauri runtimes (tests, SSR, standalone Node). The dynamic import is
 * cached by the module loader after the first call.
 */
let writeLogFn: ((entry: LogEntry) => Promise<void>) | null | undefined;
async function writeToTauri(entry: LogEntry): Promise<void> {
  if (writeLogFn === undefined) {
    // Detect Tauri without importing the API (which throws if unavailable).
    const hasTauri =
      typeof globalThis !== 'undefined' &&
      // @ts-expect-error – internal Tauri global injected into the webview
      (globalThis.__TAURI_INTERNALS__ !== undefined ||
        // @ts-expect-error – legacy global
        globalThis.__TAURI__ !== undefined);
    if (!hasTauri) {
      writeLogFn = null;
      return;
    }
    const { invoke } = await import('@tauri-apps/api/core');
    writeLogFn = (e) => invoke('write_log', { entry: e });
  }
  if (writeLogFn) await writeLogFn(entry);
}

class Logger {
  private emit(entry: LogEntry): void {
    if (isDev) {
      // Bind console methods: calling them unbound throws `Illegal invocation`
      // in strict-mode browsers.
      const fn =
        entry.level === 'error'
          ? console.error.bind(console)
          : entry.level === 'warn'
            ? console.warn.bind(console)
            : console.log.bind(console);
      fn(
        `[${entry.ts}] [${entry.category}] ${entry.level.toUpperCase()} ${entry.message}`,
        entry.payload ?? '',
      );
      return;
    }

    // In prod: ship to the Tauri file logger when available, otherwise fall
    // back to console so Node-side code (migrations, db init) is never silent.
    writeToTauri(entry).catch(() => {
      /* swallowed: logging must never throw */
    });
  }

  private ts() {
    return new Date().toISOString();
  }

  debug(m: string, p?: Record<string, unknown>) {
    this.emit({ ts: this.ts(), level: 'debug', category: 'application', message: m, payload: p });
  }
  info(m: string, p?: Record<string, unknown>) {
    this.emit({ ts: this.ts(), level: 'info', category: 'application', message: m, payload: p });
  }
  warn(m: string, p?: Record<string, unknown>) {
    this.emit({ ts: this.ts(), level: 'warn', category: 'application', message: m, payload: p });
  }
  error(m: string, p?: Record<string, unknown>) {
    this.emit({ ts: this.ts(), level: 'error', category: 'application', message: m, payload: p });
  }

  category(cat: LogCategory) {
    return {
      debug: (m: string, p?: Record<string, unknown>) =>
        this.emit({ ts: this.ts(), level: 'debug', category: cat, message: m, payload: p }),
      info: (m: string, p?: Record<string, unknown>) =>
        this.emit({ ts: this.ts(), level: 'info', category: cat, message: m, payload: p }),
      warn: (m: string, p?: Record<string, unknown>) =>
        this.emit({ ts: this.ts(), level: 'warn', category: cat, message: m, payload: p }),
      error: (m: string, p?: Record<string, unknown>) =>
        this.emit({ ts: this.ts(), level: 'error', category: cat, message: m, payload: p }),
    };
  }

  startSpan(name: string) {
    const spanId = crypto.randomUUID();
    const start = Date.now();
    this.emit({ ts: this.ts(), level: 'debug', category: 'application', message: `span.start: ${name}`, spanId });
    return {
      end: (opts?: { status?: 'ok' | 'error'; error?: string }) => {
        this.emit({
          ts: this.ts(),
          level: 'debug',
          category: 'application',
          message: `span.end: ${name}`,
          spanId,
          payload: { durationMs: Date.now() - start, ...opts },
        });
      },
    };
  }
}

export const logger = new Logger();
