// src/backend/core/exceptions.ts
export class ApplicationError extends Error {
  constructor(
    public code: string,
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
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
