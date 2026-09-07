import {
  loginRequestSchema,
  messageResponseSchema,
  registerRequestSchema,
  requestPasswordResetSchema,
  resetPasswordRequestSchema,
  sessionResponseSchema,
  verifyEmailRequestSchema,
} from '@saas/shared';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Env } from '../config/env.js';
import type { Mailer } from '../auth/mailer.js';
import { passwordResetEmail, verificationEmail } from '../auth/mailer.js';
import { permissionsFor } from '../auth/rbac.js';
import * as auth from '../auth/service.js';
import { AuthError } from '../auth/service.js';
import { REFRESH_TOKEN_TTL_DAYS } from '../auth/tokens.js';

const REFRESH_COOKIE = 'refresh_token';

const STATUS_BY_CODE: Record<auth.AuthErrorCode, number> = {
  EMAIL_TAKEN: 409,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 403,
  INVALID_TOKEN: 401,
  TOKEN_REUSED: 401,
  NO_ORGANIZATION: 409,
};

const errorResponseSchema = z.object({ error: z.string(), message: z.string() });

// SameSite=Strict means a cross-site request never carries this cookie, which
// is what protects the refresh endpoint from CSRF.
function cookieOptions(env: Env) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/auth',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  };
}

function meta(request: FastifyRequest): auth.RequestMeta {
  return { userAgent: request.headers['user-agent'], ip: request.ip };
}

async function sendSession(
  reply: FastifyReply,
  env: Env,
  session: auth.Session,
): Promise<FastifyReply> {
  return reply.setCookie(REFRESH_COOKIE, session.refreshToken, cookieOptions(env)).send({
    accessToken: session.accessToken,
    expiresInSeconds: session.expiresInSeconds,
    user: session.user,
    organization: session.organization,
  });
}

export interface AuthRouteOptions {
  env: Env;
  mailer: Mailer;
}

export function registerAuthRoutes(app: FastifyInstance, options: AuthRouteOptions): void {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const { env, mailer } = options;
  const deps: auth.AuthDeps = { prisma: app.prisma, jwtSecret: env.JWT_SECRET };

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AuthError) {
      return reply
        .status(STATUS_BY_CODE[error.code])
        .send({ error: error.code, message: error.message });
    }

    return reply.send(error);
  });

  typed.post(
    '/auth/register',
    {
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      schema: {
        body: registerRequestSchema,
        response: { 201: messageResponseSchema, 409: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const { verificationToken } = await auth.register(deps, request.body);
      const [subject, body] = verificationEmail(env.WEB_ORIGIN, verificationToken);

      await mailer.send(request.body.email, subject, body);

      return reply.status(201).send({ message: 'Check your email to confirm your address' });
    },
  );

  typed.post(
    '/auth/verify-email',
    {
      config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
      schema: {
        body: verifyEmailRequestSchema,
        response: { 200: messageResponseSchema, 401: errorResponseSchema },
      },
    },
    async (request) => {
      await auth.verifyEmail(deps, request.body.token);
      return { message: 'Email address confirmed' };
    },
  );

  typed.post(
    '/auth/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
      schema: {
        body: loginRequestSchema,
        response: {
          200: sessionResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const session = await auth.login(deps, request.body, meta(request));
      return sendSession(reply, env, session);
    },
  );

  typed.post(
    '/auth/refresh',
    {
      schema: { response: { 200: sessionResponseSchema, 401: errorResponseSchema } },
    },
    async (request, reply) => {
      const presented: unknown = request.cookies[REFRESH_COOKIE];

      if (typeof presented !== 'string') {
        throw new AuthError('INVALID_TOKEN', 'Session expired, sign in again');
      }

      const session = await auth.refresh(deps, presented, meta(request));
      return sendSession(reply, env, session);
    },
  );

  typed.post(
    '/auth/logout',
    { schema: { response: { 200: messageResponseSchema } } },
    async (request, reply) => {
      const presented: unknown = request.cookies[REFRESH_COOKIE];

      if (typeof presented === 'string') {
        await auth.logout(deps, presented);
      }

      return reply.clearCookie(REFRESH_COOKIE, { path: '/auth' }).send({ message: 'Signed out' });
    },
  );

  typed.post(
    '/auth/password-reset/request',
    {
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      schema: { body: requestPasswordResetSchema, response: { 200: messageResponseSchema } },
    },
    async (request) => {
      const result = await auth.requestPasswordReset(deps, request.body.email);

      if (result) {
        const [subject, body] = passwordResetEmail(env.WEB_ORIGIN, result.token);
        await mailer.send(request.body.email, subject, body);
      }

      // Identical response either way, so this cannot be used to discover which
      // addresses are registered.
      return { message: 'If that address has an account, a reset link is on its way' };
    },
  );

  typed.post(
    '/auth/password-reset/confirm',
    {
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      schema: {
        body: resetPasswordRequestSchema,
        response: { 200: messageResponseSchema, 401: errorResponseSchema },
      },
    },
    async (request) => {
      await auth.resetPassword(deps, request.body.token, request.body.password);
      return { message: 'Password updated, sign in again' };
    },
  );

  typed.get(
    '/auth/me',
    {
      preHandler: app.requireAuth,
      schema: {
        response: {
          200: z.object({
            userId: z.string(),
            organizationId: z.string(),
            role: z.string(),
            permissions: z.array(z.string()),
          }),
          401: errorResponseSchema,
        },
      },
    },
    (request) => {
      const claims = request.auth;

      if (!claims) {
        throw new AuthError('INVALID_TOKEN', 'Sign in to continue');
      }

      return {
        userId: claims.userId,
        organizationId: claims.organizationId,
        role: claims.role,
        permissions: [...permissionsFor(claims.role)],
      };
    },
  );
}
