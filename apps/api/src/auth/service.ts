import type { Role } from '@saas/shared';

import type { PrismaClient } from '../generated/prisma/client.js';
import { hashPassword, verifyPassword } from './password.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  PASSWORD_RESET_TTL_MINUTES,
  REFRESH_TOKEN_TTL_DAYS,
  VERIFICATION_TOKEN_TTL_HOURS,
  expiresInDays,
  expiresInHours,
  expiresInMinutes,
  generateOpaqueToken,
  hashOpaqueToken,
  signAccessToken,
} from './tokens.js';

export type AuthErrorCode =
  | 'EMAIL_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_TOKEN'
  | 'TOKEN_REUSED'
  | 'NO_ORGANIZATION';

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthDeps {
  prisma: PrismaClient;
  jwtSecret: string;
}

export interface RequestMeta {
  userAgent?: string | undefined;
  ip?: string | undefined;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: { id: string; email: string; name: string; emailVerified: boolean };
  organization: { id: string; name: string; slug: string; role: Role };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function uniqueSlug(prisma: PrismaClient, name: string): Promise<string> {
  const base = slugify(name) || 'org';

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${String(attempt + 1)}`;
    const existing = await prisma.organization.findUnique({ where: { slug: candidate } });

    if (!existing) return candidate;
  }

  return `${base}-${generateOpaqueToken().token.slice(0, 8)}`;
}

/**
 * Comparing against a real hash for unknown accounts keeps the response time
 * of "no such user" and "wrong password" indistinguishable, so login cannot be
 * used to enumerate registered addresses.
 */
let decoyHash: string | undefined;

async function equalTimeReject(password: string): Promise<never> {
  decoyHash ??= await hashPassword('decoy-password-for-constant-time-compare');
  await verifyPassword(decoyHash, password);
  throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
}

async function issueSession(
  deps: AuthDeps,
  userId: string,
  familyId: string | null,
  meta: RequestMeta,
): Promise<Session> {
  const membership = await deps.prisma.membership.findFirst({
    where: { userId },
    include: { organization: true, user: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!membership) {
    throw new AuthError('NO_ORGANIZATION', 'User does not belong to an organization');
  }

  const { token, tokenHash } = generateOpaqueToken();

  await deps.prisma.refreshToken.create({
    data: {
      userId,
      familyId: familyId ?? generateOpaqueToken().tokenHash,
      tokenHash,
      expiresAt: expiresInDays(REFRESH_TOKEN_TTL_DAYS),
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
    },
  });

  const accessToken = await signAccessToken(deps.jwtSecret, {
    userId,
    organizationId: membership.organizationId,
    role: membership.role,
  });

  return {
    accessToken,
    refreshToken: token,
    expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
    user: {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      emailVerified: membership.user.emailVerifiedAt !== null,
    },
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
    },
  };
}

export async function register(
  deps: AuthDeps,
  input: { email: string; password: string; name: string; organizationName: string },
): Promise<{ verificationToken: string }> {
  const existing = await deps.prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new AuthError('EMAIL_TAKEN', 'That email address is already registered');
  }

  const passwordHash = await hashPassword(input.password);
  const slug = await uniqueSlug(deps.prisma, input.organizationName);
  const verification = generateOpaqueToken();

  await deps.prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, name: input.name, passwordHash },
    });

    const organization = await tx.organization.create({
      data: { name: input.organizationName, slug },
    });

    await tx.membership.create({
      data: { userId: user.id, organizationId: organization.id, role: 'OWNER' },
    });

    await tx.verificationToken.create({
      data: {
        userId: user.id,
        purpose: 'EMAIL_VERIFICATION',
        tokenHash: verification.tokenHash,
        expiresAt: expiresInHours(VERIFICATION_TOKEN_TTL_HOURS),
      },
    });
  });

  return { verificationToken: verification.token };
}

export async function verifyEmail(deps: AuthDeps, token: string): Promise<void> {
  const record = await deps.prisma.verificationToken.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
  });

  if (
    !record ||
    record.purpose !== 'EMAIL_VERIFICATION' ||
    record.usedAt !== null ||
    record.expiresAt < new Date()
  ) {
    throw new AuthError('INVALID_TOKEN', 'This verification link is invalid or has expired');
  }

  await deps.prisma.$transaction([
    deps.prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    deps.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);
}

export async function login(
  deps: AuthDeps,
  input: { email: string; password: string },
  meta: RequestMeta,
): Promise<Session> {
  const user = await deps.prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    return equalTimeReject(input.password);
  }

  const valid = await verifyPassword(user.passwordHash, input.password);

  if (!valid) {
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.emailVerifiedAt === null) {
    throw new AuthError('EMAIL_NOT_VERIFIED', 'Confirm your email address before signing in');
  }

  return issueSession(deps, user.id, null, meta);
}

/**
 * Rotates the refresh token. Presenting a token that was already consumed has
 * no innocent explanation, so the whole rotation family is revoked and both the
 * attacker and the legitimate user are forced to re-authenticate.
 */
export async function refresh(
  deps: AuthDeps,
  presentedToken: string,
  meta: RequestMeta,
): Promise<Session> {
  const record = await deps.prisma.refreshToken.findUnique({
    where: { tokenHash: hashOpaqueToken(presentedToken) },
  });

  if (!record) {
    throw new AuthError('INVALID_TOKEN', 'Session expired, sign in again');
  }

  if (record.usedAt !== null || record.revokedAt !== null) {
    await deps.prisma.refreshToken.updateMany({
      where: { familyId: record.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    throw new AuthError('TOKEN_REUSED', 'Session revoked, sign in again');
  }

  if (record.expiresAt < new Date()) {
    throw new AuthError('INVALID_TOKEN', 'Session expired, sign in again');
  }

  await deps.prisma.refreshToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return issueSession(deps, record.userId, record.familyId, meta);
}

export async function logout(deps: AuthDeps, presentedToken: string): Promise<void> {
  const record = await deps.prisma.refreshToken.findUnique({
    where: { tokenHash: hashOpaqueToken(presentedToken) },
  });

  if (!record) return;

  // Revoke the family: signing out should end the session on every device that
  // inherited from it, not just this one token.
  await deps.prisma.refreshToken.updateMany({
    where: { familyId: record.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function requestPasswordReset(
  deps: AuthDeps,
  email: string,
): Promise<{ token: string } | null> {
  const user = await deps.prisma.user.findUnique({ where: { email } });

  // Callers always report success, so this returning null must not change the
  // response the client sees.
  if (!user) return null;

  const reset = generateOpaqueToken();

  await deps.prisma.verificationToken.create({
    data: {
      userId: user.id,
      purpose: 'PASSWORD_RESET',
      tokenHash: reset.tokenHash,
      expiresAt: expiresInMinutes(PASSWORD_RESET_TTL_MINUTES),
    },
  });

  return { token: reset.token };
}

export async function resetPassword(
  deps: AuthDeps,
  token: string,
  password: string,
): Promise<void> {
  const record = await deps.prisma.verificationToken.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
  });

  if (
    !record ||
    record.purpose !== 'PASSWORD_RESET' ||
    record.usedAt !== null ||
    record.expiresAt < new Date()
  ) {
    throw new AuthError('INVALID_TOKEN', 'This reset link is invalid or has expired');
  }

  const passwordHash = await hashPassword(password);

  await deps.prisma.$transaction([
    deps.prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    deps.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    // Changing the password ends every existing session.
    deps.prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
