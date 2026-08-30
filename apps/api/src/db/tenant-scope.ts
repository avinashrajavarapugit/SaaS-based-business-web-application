import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Models whose rows belong to exactly one organization. Anything listed here is
 * automatically filtered; anything not listed is deliberately global.
 *
 * Membership and Organization are excluded on purpose: they are read during
 * authentication, before a tenant context exists.
 */
const TENANT_MODELS = new Set(['Document', 'Invite']);

const OPERATIONS_WITH_WHERE = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
]);

type Args = Record<string, unknown>;

function scopeArgs(operation: string, args: Args, organizationId: string): Args {
  if (OPERATIONS_WITH_WHERE.has(operation)) {
    const where = (args.where ?? {}) as Args;
    return { ...args, where: { ...where, organizationId } };
  }

  if (operation === 'create') {
    const data = (args.data ?? {}) as Args;
    return { ...args, data: { ...data, organizationId } };
  }

  if (operation === 'createMany' || operation === 'createManyAndReturn') {
    const data = args.data as Args | Args[] | undefined;
    const rows = Array.isArray(data) ? data : [data ?? {}];
    return { ...args, data: rows.map((row) => ({ ...row, organizationId })) };
  }

  if (operation === 'upsert') {
    const where = (args.where ?? {}) as Args;
    const create = (args.create ?? {}) as Args;
    return {
      ...args,
      where: { ...where, organizationId },
      create: { ...create, organizationId },
    };
  }

  // An operation we have not classified must not silently run unscoped.
  throw new Error(`Operation "${operation}" is not tenant-scoped; refusing to run it`);
}

/**
 * Wraps a client so every query against a tenant model is confined to one
 * organization.
 *
 * Reads have the organizationId filter *injected*, so a forgotten filter cannot
 * leak another tenant's rows. Writes have organizationId *overwritten*, so a
 * caller passing the wrong one cannot persist it. Postgres RLS enforces the
 * same rule independently, so a gap here still cannot leak data.
 */
export function withTenantScope<T extends object>(client: T, organizationId: string): T {
  return (client as unknown as PrismaClient).$extends({
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) {
            return query(args);
          }

          return query(scopeArgs(operation, args, organizationId));
        },
      },
    },
  }) as unknown as T;
}
