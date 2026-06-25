import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:1420', // Tauri dev URL
  },
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
});