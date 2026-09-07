import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

const ADMIN_URL =
  process.env.TEST_ADMIN_DATABASE_URL ?? 'postgresql://saas:saas@localhost:5432/postgres';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://saas_app:saas_app@localhost:5432/saas_test';

/**
 * Tests run against their own database so a run cannot destroy development
 * data, and so each run starts from a known schema.
 */
export default async function setup(): Promise<void> {
  const admin = new PrismaClient({ adapter: new PrismaPg({ connectionString: ADMIN_URL }) });

  try {
    await admin.$executeRawUnsafe('DROP DATABASE IF EXISTS saas_test');
    await admin.$executeRawUnsafe('CREATE DATABASE saas_test OWNER saas_app');
  } finally {
    await admin.$disconnect();
  }

  execSync('pnpm exec prisma migrate deploy', {
    // fileURLToPath, not URL.pathname: the repository path contains a space.
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}
