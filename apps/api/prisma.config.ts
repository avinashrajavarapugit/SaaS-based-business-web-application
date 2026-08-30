import { loadEnvFile } from 'node:process';

import { defineConfig } from 'prisma/config';

// Prisma 7 no longer reads .env itself. CI injects the variables directly,
// so a missing file is expected rather than an error.
try {
  loadEnvFile('.env');
} catch {
  /* empty */
}

// Prisma 7 moved the connection URL out of schema.prisma and into this file.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
