import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import type { Env } from '../config/env.js';
import { createPrismaClient } from '../db/client.js';
import type { PrismaClient } from '../generated/prisma/client.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

function prismaPlugin(
  app: FastifyInstance,
  options: { env: Env },
  done: (error?: Error) => void,
): void {
  const prisma = createPrismaClient(options.env);

  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  done();
}

// fp() opts out of encapsulation so `app.prisma` is visible to sibling plugins.
export default fp(prismaPlugin, { name: 'prisma' });
