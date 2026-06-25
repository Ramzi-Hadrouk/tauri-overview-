// src/backend/config/env.ts
import { z } from 'zod';

/**
 * Application configuration parsed from the environment via zod.
 *
 * Validated once at module load so a misconfiguration fails fast with a clear
 * message instead of surfacing later as an obscure runtime error.
 *
 * NOTE on process.env: this module may be imported from both Node (bootstrap,
 * migration runner) and the Tauri webview. Next.js statically replaces
 * `process.env.NODE_ENV` in the browser bundle, so it is always present.
 * Other vars are intentionally not read here because the real runtime values
 * (e.g. the database path) are delivered via Tauri IPC/managed state, not env.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('production'),
});

const parsed = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
});

/** True outside of production — gates verbose logging and dev-only behaviour. */
export const isDev = parsed.NODE_ENV !== 'production';

export const NODE_ENV = parsed.NODE_ENV;
