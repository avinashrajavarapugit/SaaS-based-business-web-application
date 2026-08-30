import { healthResponseSchema, readinessResponseSchema } from '@saas/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

const API_VERSION = '2.0.0';

export function registerHealthRoutes(app: FastifyInstance): void {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Liveness: is the process running at all? Never touches dependencies.
  typed.get(
    '/health',
    { schema: { response: { 200: healthResponseSchema } } },
    () => ({
      status: 'ok' as const,
      version: API_VERSION,
      uptimeSeconds: Math.floor(process.uptime()),
    }),
  );

  // Readiness: can this instance actually serve traffic?
  typed.get(
    '/readyz',
    { schema: { response: { 200: readinessResponseSchema } } },
    () => ({
      status: 'degraded' as const,
      checks: { database: 'down' as const },
    }),
  );
}
