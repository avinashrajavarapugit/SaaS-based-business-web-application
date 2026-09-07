import { describe, expect, it } from 'vitest';

import {
  generateOpaqueToken,
  hashOpaqueToken,
  signAccessToken,
  verifyAccessToken,
} from '../src/auth/tokens.js';

const SECRET = 'a-test-secret-that-is-at-least-32-characters';

describe('access tokens', () => {
  const claims = { userId: 'user-1', organizationId: 'org-1', role: 'ADMIN' as const };

  it('round-trips claims', async () => {
    const token = await signAccessToken(SECRET, claims);
    await expect(verifyAccessToken(SECRET, token)).resolves.toEqual(claims);
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signAccessToken(SECRET, claims);
    await expect(
      verifyAccessToken('another-secret-of-at-least-32-characters', token),
    ).resolves.toBeNull();
  });

  it('rejects a tampered payload', async () => {
    const token = await signAccessToken(SECRET, claims);
    const [header, , signature] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({ sub: 'user-2', org: 'org-2', role: 'OWNER' }),
    ).toString('base64url');

    await expect(
      verifyAccessToken(SECRET, `${String(header)}.${forged}.${String(signature)}`),
    ).resolves.toBeNull();
  });

  it('rejects malformed input', async () => {
    await expect(verifyAccessToken(SECRET, 'not-a-jwt')).resolves.toBeNull();
    await expect(verifyAccessToken(SECRET, '')).resolves.toBeNull();
  });

  it('rejects an unknown role', async () => {
    const token = await signAccessToken(SECRET, {
      ...claims,
      role: 'SUPERUSER' as unknown as typeof claims.role,
    });

    await expect(verifyAccessToken(SECRET, token)).resolves.toBeNull();
  });
});

describe('opaque tokens', () => {
  it('hashes deterministically and never returns the hash as the token', () => {
    const { token, tokenHash } = generateOpaqueToken();

    expect(tokenHash).toBe(hashOpaqueToken(token));
    expect(tokenHash).not.toBe(token);
  });

  it('does not repeat', () => {
    const tokens = new Set(Array.from({ length: 500 }, () => generateOpaqueToken().token));
    expect(tokens.size).toBe(500);
  });
});
