// src/backend/core/result.ts
import type { ApplicationError } from "./exceptions";
export type Result<T, E = ApplicationError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
