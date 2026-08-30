import { loadEnvFile } from 'node:process';

import { PrismaPg } from '@prisma/adapter-pg';

import { hashPassword } from '../src/auth/password.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

try {
  loadEnvFile('.env');
} catch {
  /* empty */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

// Two organizations exist so tenant-isolation tests have something to leak across.
const SEED_PASSWORD = 'Password123!';

async function main(): Promise<void> {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const [acme, globex] = await Promise.all([
    prisma.organization.upsert({
      where: { slug: 'acme' },
      update: {},
      create: { name: 'Acme Inc', slug: 'acme' },
    }),
    prisma.organization.upsert({
      where: { slug: 'globex' },
      update: {},
      create: { name: 'Globex Corp', slug: 'globex' },
    }),
  ]);

  const ada = await prisma.user.upsert({
    where: { email: 'ada@acme.test' },
    update: {},
    create: {
      email: 'ada@acme.test',
      name: 'Ada Lovelace',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const grace = await prisma.user.upsert({
    where: { email: 'grace@globex.test' },
    update: {},
    create: {
      email: 'grace@globex.test',
      name: 'Grace Hopper',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: ada.id, organizationId: acme.id } },
    update: {},
    create: { userId: ada.id, organizationId: acme.id, role: 'OWNER' },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: grace.id, organizationId: globex.id } },
    update: {},
    create: { userId: grace.id, organizationId: globex.id, role: 'OWNER' },
  });

  await prisma.document.createMany({
    data: [
      {
        organizationId: acme.id,
        authorId: ada.id,
        title: 'Acme Q3 pricing review',
        body: 'Internal to Acme. Globex must never be able to read this.',
      },
      {
        organizationId: globex.id,
        authorId: grace.id,
        title: 'Globex onboarding checklist',
        body: 'Internal to Globex. Acme must never be able to read this.',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Seeded ${acme.slug} (${ada.email}) and ${globex.slug} (${grace.email})`);
  console.log(`Password for both: ${SEED_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
