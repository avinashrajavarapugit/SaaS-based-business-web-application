import { z } from 'zod';

export const healthStatusSchema = z.enum(['ok', 'degraded']);

export const healthResponseSchema = z.object({
  status: healthStatusSchema,
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
});

/** Readiness additionally reports whether downstream dependencies are usable. */
export const readinessResponseSchema = z.object({
  status: healthStatusSchema,
  checks: z.object({
    database: z.enum(['up', 'down']),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
