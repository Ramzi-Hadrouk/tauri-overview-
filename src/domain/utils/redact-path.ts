// src/backend/shared/utils/redact-path.ts

/**
 * Reduce an absolute path to its basename so logs never leak the home
 * directory (PII) or internal directory structure.
 */
export function redactPath(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] ?? path;
}
