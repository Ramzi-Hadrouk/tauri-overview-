import { AppConfig } from '@/backend/config/env';

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

const isDev = AppConfig.isDev;

class Logger {
  private emit(entry: LogEntry): void {
    if (isDev) {
      const fn =
        entry.level === "error"
          ? console.error
          : entry.level === "warn"
            ? console.warn
            : console.log;
      fn(
        `[${entry.ts}] [${entry.category}] ${entry.level.toUpperCase()} ${entry.message}`,
        entry.payload ?? "",
      );
    }
    // In prod: fire-and-forget to Tauri file logger
    if (!isDev && typeof window !== "undefined") {
      import("@tauri-apps/api/core")
        .then(({ invoke }) => invoke("write_log", { entry }).catch(() => {}))
        .catch(() => {});
    }
  }

  private ts() {
    return new Date().toISOString();
  }

  debug(m: string, p?: Record<string, unknown>) {
    this.emit({
      ts: this.ts(),
      level: "debug",
      category: "application",
      message: m,
      payload: p,
    });
  }
  info(m: string, p?: Record<string, unknown>) {
    this.emit({
      ts: this.ts(),
      level: "info",
      category: "application",
      message: m,
      payload: p,
    });
  }
  warn(m: string, p?: Record<string, unknown>) {
    this.emit({
      ts: this.ts(),
      level: "warn",
      category: "application",
      message: m,
      payload: p,
    });
  }
  error(m: string, p?: Record<string, unknown>) {
    this.emit({
      ts: this.ts(),
      level: "error",
      category: "application",
      message: m,
      payload: p,
    });
  }

  category(cat: LogCategory) {
    return {
      debug: (m: string, p?: Record<string, unknown>) =>
        this.emit({
          ts: this.ts(),
          level: "debug",
          category: cat,
          message: m,
          payload: p,
        }),
      info: (m: string, p?: Record<string, unknown>) =>
        this.emit({
          ts: this.ts(),
          level: "info",
          category: cat,
          message: m,
          payload: p,
        }),
      warn: (m: string, p?: Record<string, unknown>) =>
        this.emit({
          ts: this.ts(),
          level: "warn",
          category: cat,
          message: m,
          payload: p,
        }),
      error: (m: string, p?: Record<string, unknown>) =>
        this.emit({
          ts: this.ts(),
          level: "error",
          category: cat,
          message: m,
          payload: p,
        }),
    };
  }

  startSpan(name: string) {
    const spanId = crypto.randomUUID();
    const start = Date.now();
    this.emit({
      ts: this.ts(),
      level: "debug",
      category: "application",
      message: `span.start: ${name}`,
      spanId,
    });
    return {
      end: (opts?: { status?: "ok" | "error"; error?: string }) => {
        this.emit({
          ts: this.ts(),
          level: "debug",
          category: "application",
          message: `span.end: ${name}`,
          spanId,
          payload: { durationMs: Date.now() - start, ...opts },
        });
      },
    };
  }
}

export const logger = new Logger();
