// Error tracking / monitoring — extend with Sentry or similar as needed
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  console.error('[monitoring]', error, context ?? {});
}
