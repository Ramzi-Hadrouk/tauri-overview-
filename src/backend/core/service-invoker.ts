// src/backend/core/service-invoker.ts
import { container } from '@/backend/di/container';
import { logger } from '@/backend/core/tracing';
import { ApplicationError } from '@/backend/core/exceptions';
import type { Result } from '@/backend/core/result';

/**
 * In-process invocation of an application service.
 * The only way the frontend calls backend services — no HTTP involved.
 */
export async function invokeService<TArgs extends unknown[], TResult>(
  serviceKey: keyof typeof container,
  method: string,
  ...args: TArgs
): Promise<Result<TResult, ApplicationError>> {
  const span = logger.startSpan(`service:${String(serviceKey)}.${method}`);
  try {
    const service = container[serviceKey] as unknown as Record<string, (...a: TArgs) => Promise<TResult>>;
    if (!service || typeof service[method] !== 'function') {
      throw new Error(`Service ${String(serviceKey)}.${method} not registered`);
    }
    const data = await service[method](...args);
    span.end({ status: 'ok' });
    return { ok: true, value: data };
  } catch (err) {
    span.end({ status: 'error', error: String(err) });
    logger.error('service.invocation.failed', { service: serviceKey, method, error: err });
    return {
      ok: false,
      error: err instanceof ApplicationError ? err : new ApplicationError('UNEXPECTED', String(err)),
    };
  }
}