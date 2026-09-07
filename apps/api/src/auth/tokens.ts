import { createHash, randomBytes } from 'node:crypto';

import type { Role } from '@saas/shared';
import { SignJWT, jwtVerify } from 'jose';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const VERIFICATION_TOKEN_TTL_HOURS = 24;
export const PASSWORD_RESET_TTL_MINUTES = 30;

export interface AccessTokenClaims {
  userId: string;
  organizationId: string;
  role: Role;
}

function keyFrom(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function signAccessToken(secret: string, claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({ org: claims.organizationId, role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(`${String(ACCESS_TOKEN_TTL_SECONDS)}s`)
    .sign(keyFrom(secret));
}

/** Returns null for any invalid, expired or tampered token. */
export async function verifyAccessToken(
  secret: string,
  token: string,
): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, keyFrom(secret), { algorithms: ['HS256'] });
    const { sub, org, role } = payload;

    if (typeof sub !== 'string' || typeof org !== 'string' || typeof role !== 'string') {
      return null;
    }

    if (role !== 'OWNER' && role !== 'ADMIN' && role !== 'MEMBER') {
      return null;
    }

    return { userId: sub, organizationId: org, role };
  } catch {
    return null;
  }
}

/**
 * 256 bits of entropy, so SHA-256 at rest is sufficient: unlike a password
 * there is no smaller search space to brute force, and a slow KDF would only
 * add latency to every refresh.
 */
export function generateOpaqueToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashOpaqueToken(token) };
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function expiresInDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function expiresInHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export function expiresInMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
