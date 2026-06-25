// src/backend/core/service-invoker.ts
import { container, type Container } from '@/backend/di/container';
import { logger } from '@/backend/core/tracing';
import { ApplicationError } from '@/backend/core/exceptions';
import type { Result } from '@/backend/core/result';

/**
 * Maps each service in the container to the signature of its `execute` method.
 * This is the single source of truth that makes `invokeService` fully typed:
 * a typo'd service key, method name, or argument is a compile error.
 */
type ServiceRegistry = {
  [K in keyof Container]: {
    execute: Container[K]['execute'];
  };
};

/**
 * In-process invocation of an application service.
 * The only way the frontend calls backend services — no HTTP involved.
 */
export async function invokeService<
  K extends keyof ServiceRegistry,
  // Pull the execute() arg tuple and return type straight from the registry.
>(
  serviceKey: K,
  method: 'execute',
  ...args: Parameters<ServiceRegistry[K]['execute']>
): Promise<Result<Awaited<ReturnType<ServiceRegistry[K]['execute']>>, ApplicationError>> {
  const span = logger.startSpan(`service:${String(serviceKey)}.${method}`);
  try {
    const service = container[serviceKey] as unknown as {
      execute: (...a: Parameters<ServiceRegistry[K]['execute']>) => unknown;
    };
    if (!service || typeof service.execute !== 'function') {
      throw new ApplicationError(
        'SERVICE_NOT_REGISTERED',
        `Service ${String(serviceKey)}.${method} not registered`,
        { serviceKey },
      );
    }
    const data = (await service.execute(...args)) as Awaited<
      ReturnType<ServiceRegistry[K]['execute']>
    >;
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
