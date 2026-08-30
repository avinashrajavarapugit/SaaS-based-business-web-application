import { loadEnvFile } from 'node:process';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';
import { withTenant, withTenantRlsOnly } from '../src/db/tenant.js';

try {
  loadEnvFile('.env');
} catch {
  /* empty */
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

let failures = 0;

function check(label: string, passed: boolean, detail: string): void {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label} — ${detail}`);
  if (!passed) failures += 1;
}

async function main(): Promise<void> {
  const acme = await prisma.organization.findUniqueOrThrow({ where: { slug: 'acme' } });
  const globex = await prisma.organization.findUniqueOrThrow({ where: { slug: 'globex' } });

  // Test 5 attempts a write; clear any row it managed to leave behind so the
  // script is repeatable.
  for (const org of [acme, globex]) {
    await withTenant(prisma, org.id, (db) =>
      db.document.deleteMany({ where: { title: 'smuggled' } }),
    );
  }

  // 1. Both layers on: each tenant sees only its own rows.
  const acmeDocs = await withTenant(prisma, acme.id, (db) => db.document.findMany());
  const globexDocs = await withTenant(prisma, globex.id, (db) => db.document.findMany());

  check(
    'both layers, Acme',
    acmeDocs.length === 1 && acmeDocs[0]?.organizationId === acme.id,
    `saw ${String(acmeDocs.length)} doc(s): ${acmeDocs.map((d) => d.title).join(', ')}`,
  );
  check(
    'both layers, Globex',
    globexDocs.length === 1 && globexDocs[0]?.organizationId === globex.id,
    `saw ${String(globexDocs.length)} doc(s): ${globexDocs.map((d) => d.title).join(', ')}`,
  );

  // 2. Application layer DISABLED: an unfiltered findMany must still be scoped.
  //    This is the test that proves RLS works on its own.
  const rlsOnly = await withTenantRlsOnly(prisma, acme.id, (db) => db.document.findMany());
  check(
    'RLS alone (extension disabled)',
    rlsOnly.length === 1 && rlsOnly[0]?.organizationId === acme.id,
    `unfiltered findMany returned ${String(rlsOnly.length)} row(s), all Acme`,
  );

  // 3. Explicitly asking for the other tenant's rows returns nothing.
  const crossTenant = await withTenantRlsOnly(prisma, acme.id, (db) =>
    db.document.findMany({ where: { organizationId: globex.id } }),
  );
  check(
    'explicit cross-tenant read',
    crossTenant.length === 0,
    `asked for Globex rows while scoped to Acme, got ${String(crossTenant.length)}`,
  );

  // 4. No tenant context at all: fail closed, not open.
  const noContext = await prisma.document.findMany();
  check(
    'no tenant context',
    noContext.length === 0,
    `returned ${String(noContext.length)} row(s) with no tenant set`,
  );

  // 5. WITH CHECK must reject writing a row into another tenant.
  const ada = await prisma.user.findUniqueOrThrow({ where: { email: 'ada@acme.test' } });
  let writeRejected = false;

  try {
    await withTenantRlsOnly(prisma, acme.id, (db) =>
      db.document.create({
        data: {
          organizationId: globex.id,
          authorId: ada.id,
          title: 'smuggled',
          body: 'should never persist',
        },
      }),
    );
  } catch {
    writeRejected = true;
  }

  check('cross-tenant write', writeRejected, 'insert into another tenant was rejected');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    failures += 1;
  })
  .finally(() => {
    void prisma.$disconnect();
    console.log(failures === 0 ? '\nAll tenant isolation checks passed.' : `\n${failures} FAILED`);
    process.exitCode = failures === 0 ? 0 : 1;
  });
