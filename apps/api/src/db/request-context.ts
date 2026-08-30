import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  userId: string;
  organizationId: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Throws rather than returning undefined so a missing tenant fails closed. */
export function requireContext(): RequestContext {
  const context = storage.getStore();

  if (!context) {
    throw new Error('No request context: a tenant-scoped query ran outside a request');
  }

  return context;
}
