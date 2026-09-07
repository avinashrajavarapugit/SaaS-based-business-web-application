import type { Role } from '@saas/shared';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import type { Env } from '../config/env.js';
import type { Permission } from '../auth/rbac.js';
import { can } from '../auth/rbac.js';
import { verifyAccessToken, type AccessTokenClaims } from '../auth/tokens.js';

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission: (
      permission: Permission,
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    auth?: AccessTokenClaims;
  }
}

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;

  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim() || null;
}

function authPlugin(app: FastifyInstance, options: { env: Env }, done: (e?: Error) => void): void {
  app.decorateRequest('auth', undefined);

  app.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = bearerToken(request);
    const claims = token ? await verifyAccessToken(options.env.JWT_SECRET, token) : null;

    if (!claims) {
      await reply.status(401).send({ error: 'UNAUTHENTICATED', message: 'Sign in to continue' });
      return;
    }

    request.auth = claims;
  });

  app.decorate(
    'requirePermission',
    (permission: Permission) => async (request: FastifyRequest, reply: FastifyReply) => {
      const role: Role | undefined = request.auth?.role;

      if (!role || !can(role, permission)) {
        await reply
          .status(403)
          .send({ error: 'FORBIDDEN', message: 'You do not have access to do that' });
      }
    },
  );

  done();
}

export default fp(authPlugin, { name: 'auth' });
