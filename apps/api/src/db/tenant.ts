import type { PrismaClient } from '../generated/prisma/client.js';
import { withTenantScope } from './tenant-scope.js';

export type TenantClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

function setTenant(tx: TenantClient, organizationId: string): Promise<number> {
  // The third argument makes the setting transaction-local, so a pooled
  // connection cannot carry one tenant's id into another tenant's query.
  return tx.$executeRaw`SELECT set_config('app.current_organization_id', ${organizationId}, true)`;
}

/**
 * Runs `fn` with both isolation layers active: the Prisma extension injects
 * organizationId, and Postgres RLS independently rejects anything it misses.
 *
 * The client is extended *before* the transaction is opened, because Prisma
 * transaction clients cannot be extended themselves.
 */
export function withTenant<T>(
  prisma: PrismaClient,
  organizationId: string,
  fn: (db: TenantClient) => Promise<T>,
): Promise<T> {
  const scoped = withTenantScope(prisma, organizationId);

  return scoped.$transaction(async (tx) => {
    await setTenant(tx, organizationId);
    return fn(tx);
  });
}

/**
 * Same transaction and RLS setting, but WITHOUT the Prisma extension.
 *
 * Exists so tests can prove RLS blocks cross-tenant access on its own. A test
 * that only passes with both layers enabled proves neither of them works.
 */
export function withTenantRlsOnly<T>(
  prisma: PrismaClient,
  organizationId: string,
  fn: (db: TenantClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await setTenant(tx, organizationId);
    return fn(tx);
  });
}
