import { healthResponseSchema, readinessResponseSchema } from '@saas/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

const API_VERSION = '2.0.0';

export function registerHealthRoutes(app: FastifyInstance): void {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  // Liveness: is the process running? Deliberately touches no dependencies, so a
  // database blip cannot cause every instance to be restarted at once.
  typed.get('/health', { schema: { response: { 200: healthResponseSchema } } }, () => ({
    status: 'ok' as const,
    version: API_VERSION,
    uptimeSeconds: Math.floor(process.uptime()),
  }));

  // Readiness: should this instance receive traffic?
  typed.get(
    '/readyz',
    {
      schema: {
        response: { 200: readinessResponseSchema, 503: readinessResponseSchema },
      },
    },
    async (_request, reply) => {
      let database: 'up' | 'down' = 'down';

      try {
        await app.prisma.$queryRaw`SELECT 1`;
        database = 'up';
      } catch (error) {
        app.log.error({ err: error }, 'readiness database check failed');
      }

      return reply.status(database === 'up' ? 200 : 503).send({
        status: database === 'up' ? 'ok' : 'degraded',
        checks: { database },
      });
    },
  );
}
