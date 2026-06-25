// src/backend/core/result.ts
import type { ApplicationError } from "./exceptions";

export type Result<T, E = ApplicationError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Construct a successful Result. */
export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

/** Construct a failed Result. */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Extract the value of a successful Result, or throw its error.
 * Convenience for contract layers that turn Results back into thrown errors.
 */
export function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw r.error;
  return r.value;
}

/** Type guard narrowing a Result to its success branch. */
export const isOk = <T>(r: Result<T>): r is { ok: true; value: T } => r.ok;

/** Type guard narrowing a Result to its failure branch. */
export const isErr = <T, E>(r: Result<T, E>): r is { ok: false; error: E } => !r.ok;
