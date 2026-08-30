import { PrismaPg } from '@prisma/adapter-pg';

import type { Env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

export function createPrismaClient(env: Env): PrismaClient {
  // Prisma 7 requires a driver adapter rather than an engine-managed connection.
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}
