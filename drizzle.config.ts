// drizzle.config.ts
// NOTE: This is a build-time Drizzle Kit config, not application code.
// It cannot import @/backend/config/env.ts, so it reads process.env directly.
// The default must stay in sync with AppConfig.DATABASE_URL in env.ts.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/backend/config/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? './dev.db',
  },
  verbose: true,
  strict: true,
});