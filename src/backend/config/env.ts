export class AppConfig {
  static get NODE_ENV(): string {
    return process.env.NODE_ENV ?? 'production';
  }

  static get isDev(): boolean {
    return AppConfig.NODE_ENV !== 'production';
  }

  static get DATABASE_URL(): string {
    return process.env.DATABASE_URL ?? './dev.db';
  }

  static get APP_SCHEMA_VERSION(): number {
    const raw = process.env.APP_SCHEMA_VERSION;
    if (raw !== undefined) {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`APP_SCHEMA_VERSION must be a positive integer, got: ${raw}`);
      }
      return n;
    }
    return 2;
  }

  static get MIN_COMPATIBLE_SCHEMA_VERSION(): number {
    const raw = process.env.MIN_COMPATIBLE_SCHEMA_VERSION;
    if (raw !== undefined) {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) {
        throw new Error(`MIN_COMPATIBLE_SCHEMA_VERSION must be a non-negative integer, got: ${raw}`);
      }
      return n;
    }
    return 1;
  }

  static get DB_PATH(): string {
    return process.env.DB_PATH ?? './client-manager.db';
  }
}
