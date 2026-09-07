import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import type { Env } from './config/env.js';
import type { Mailer } from './auth/mailer.js';
import { createMailer } from './auth/mailer.js';
import authPlugin from './plugins/auth.js';
import prismaPlugin from './plugins/prisma.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';

export interface AppOverrides {
  /** Lets tests capture outbound mail instead of opening an SMTP connection. */
  mailer?: Mailer;
}

export async function buildApp(env: Env, overrides: AppOverrides = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'test'
        ? false
        : {
            level: env.LOG_LEVEL,
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          },
    // Trust Render's proxy so rate limiting keys on the real client IP.
    trustProxy: env.NODE_ENV === 'production',
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);
  await app.register(cors, { origin: env.WEB_ORIGIN, credentials: true });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    // Otherwise every test sharing one client IP would exhaust the auth limits.
    allowList: () => env.NODE_ENV === 'test',
  });

  await app.register(prismaPlugin, { env });
  await app.register(authPlugin, { env });
  await app.register(registerHealthRoutes);
  await app.register(registerAuthRoutes, { env, mailer: overrides.mailer ?? createMailer(env) });

  return app;
}
