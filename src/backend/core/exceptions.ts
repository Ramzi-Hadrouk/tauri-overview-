// src/backend/core/exceptions.ts

/**
 * Base class for all application errors.
 *
 * Carries a stable machine-readable `code` plus an optional `details` payload.
 * `details` replaces the previous `cause` field, which shadowed the native
 * ES2022 `Error.cause` and was never forwarded to `super`.
 */
export class ApplicationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    // Restore prototype chain so `instanceof` works even when transpiled to ES5.
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
  }

  /** Stable serialization across the IPC boundary (logs + Tauri bridge). */
  toJSON(): { name: string; code: string; message: string; details?: unknown } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}

export class NotFoundError extends ApplicationError {
  constructor(m: string) {
    super("NOT_FOUND", m);
  }
}

export class SchemaIncompatibleError extends ApplicationError {
  constructor(m: string) {
    super("SCHEMA_INCOMPATIBLE", m);
  }
}
