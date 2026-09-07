import { sessionResponseSchema } from '@saas/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  createTestContext,
  refreshCookieFrom,
  resetDatabase,
  type TestContext,
} from './helpers.js';

const EMAIL = 'ada@example.test';
const PASSWORD = 'correct-horse-battery';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestContext();
});

afterAll(async () => {
  await ctx.close();
});

beforeEach(async () => {
  await resetDatabase(ctx.prisma);
  ctx.mailer.sent.length = 0;
});

function register(email = EMAIL) {
  return ctx.app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password: PASSWORD, name: 'Ada Lovelace', organizationName: 'Acme Inc' },
  });
}

async function registerAndVerify(email = EMAIL) {
  await register(email);
  const token = ctx.mailer.lastToken();
  await ctx.app.inject({ method: 'POST', url: '/auth/verify-email', payload: { token } });
}

function login(email = EMAIL, password = PASSWORD) {
  return ctx.app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
}

function refresh(cookie: string) {
  return ctx.app.inject({
    method: 'POST',
    url: '/auth/refresh',
    cookies: { refresh_token: cookie },
  });
}

describe('registration', () => {
  it('creates the user, organization and owner membership', async () => {
    const response = await register();

    expect(response.statusCode).toBe(201);

    const user = await ctx.prisma.user.findUnique({
      where: { email: EMAIL },
      include: { memberships: { include: { organization: true } } },
    });

    expect(user?.emailVerifiedAt).toBeNull();
    expect(user?.memberships[0]?.role).toBe('OWNER');
    expect(user?.memberships[0]?.organization.slug).toBe('acme-inc');
  });

  it('never stores the password in a recoverable form', async () => {
    await register();
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });

    expect(user.passwordHash).not.toContain(PASSWORD);
    expect(user.passwordHash.startsWith('$argon2id$')).toBe(true);
  });

  it('sends a verification email', async () => {
    await register();

    expect(ctx.mailer.sent).toHaveLength(1);
    expect(ctx.mailer.sent[0]?.to).toBe(EMAIL);
    expect(ctx.mailer.lastToken().length).toBeGreaterThan(20);
  });

  it('rejects a duplicate address', async () => {
    await register();
    const response = await register();

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: 'EMAIL_TAKEN' });
  });

  it('rejects a short password', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: EMAIL, password: 'short', name: 'A', organizationName: 'B' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('gives a second organization of the same name a distinct slug', async () => {
    await register();
    await register('grace@example.test');

    const slugs = await ctx.prisma.organization.findMany({ select: { slug: true } });

    expect(new Set(slugs.map((s) => s.slug)).size).toBe(2);
  });
});

describe('email verification', () => {
  it('marks the address verified', async () => {
    await register();
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/auth/verify-email',
      payload: { token: ctx.mailer.lastToken() },
    });

    expect(response.statusCode).toBe(200);

    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  it('refuses to reuse a verification token', async () => {
    await register();
    const token = ctx.mailer.lastToken();

    await ctx.app.inject({ method: 'POST', url: '/auth/verify-email', payload: { token } });
    const second = await ctx.app.inject({
      method: 'POST',
      url: '/auth/verify-email',
      payload: { token },
    });

    expect(second.statusCode).toBe(401);
  });

  it('rejects an unknown token', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/auth/verify-email',
      payload: { token: 'not-a-real-token' },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('login', () => {
  it('refuses an unverified account', async () => {
    await register();
    const response = await login();

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ error: 'EMAIL_NOT_VERIFIED' });
  });

  it('returns a session and sets an httpOnly refresh cookie', async () => {
    await registerAndVerify();
    const response = await login();

    expect(response.statusCode).toBe(200);

    // Parsing with the published schema also asserts the response shape.
    const body = sessionResponseSchema.parse(response.json());
    expect(body.accessToken).toBeTruthy();
    expect(body.organization.role).toBe('OWNER');
    expect(response.json()).not.toHaveProperty('refreshToken');

    const cookie = response.headers['set-cookie'];
    const header = Array.isArray(cookie) ? cookie.join(';') : String(cookie);
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Strict');
  });

  it('rejects a wrong password and an unknown address identically', async () => {
    await registerAndVerify();

    const wrongPassword = await login(EMAIL, 'not-the-password');
    const unknownEmail = await login('nobody@example.test', PASSWORD);

    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    expect(unknownEmail.json()).toEqual(wrongPassword.json());
  });
});

describe('refresh token rotation', () => {
  it('issues a new token and invalidates the presented one', async () => {
    await registerAndVerify();
    const first = refreshCookieFrom((await login()).headers);

    const rotated = await refresh(String(first));
    expect(rotated.statusCode).toBe(200);

    const second = refreshCookieFrom(rotated.headers);
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
  });

  it('revokes the whole family when a consumed token is replayed', async () => {
    await registerAndVerify();
    const original = String(refreshCookieFrom((await login()).headers));

    const rotated = await refresh(original);
    const current = String(refreshCookieFrom(rotated.headers));

    // An attacker replays the token the legitimate client already spent.
    const replay = await refresh(original);
    expect(replay.statusCode).toBe(401);
    expect(replay.json()).toMatchObject({ error: 'TOKEN_REUSED' });

    // The legitimate client's still-unused token is now dead too.
    const afterBreach = await refresh(current);
    expect(afterBreach.statusCode).toBe(401);

    const live = await ctx.prisma.refreshToken.count({ where: { revokedAt: null } });
    expect(live).toBe(0);
  });

  it('rejects an unknown token', async () => {
    const response = await refresh('not-a-real-token');
    expect(response.statusCode).toBe(401);
  });

  it('rejects a request with no cookie', async () => {
    const response = await ctx.app.inject({ method: 'POST', url: '/auth/refresh' });
    expect(response.statusCode).toBe(401);
  });
});

describe('logout', () => {
  it('revokes the session and clears the cookie', async () => {
    await registerAndVerify();
    const cookie = String(refreshCookieFrom((await login()).headers));

    const response = await ctx.app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { refresh_token: cookie },
    });

    expect(response.statusCode).toBe(200);
    await expect(refresh(cookie)).resolves.toMatchObject({ statusCode: 401 });
  });

  it('succeeds even without a session', async () => {
    const response = await ctx.app.inject({ method: 'POST', url: '/auth/logout' });
    expect(response.statusCode).toBe(200);
  });
});

describe('password reset', () => {
  it('answers identically for known and unknown addresses', async () => {
    await registerAndVerify();

    const known = await ctx.app.inject({
      method: 'POST',
      url: '/auth/password-reset/request',
      payload: { email: EMAIL },
    });
    const unknown = await ctx.app.inject({
      method: 'POST',
      url: '/auth/password-reset/request',
      payload: { email: 'nobody@example.test' },
    });

    expect(known.statusCode).toBe(200);
    expect(unknown.json()).toEqual(known.json());
  });

  it('changes the password and revokes every existing session', async () => {
    await registerAndVerify();
    const cookie = String(refreshCookieFrom((await login()).headers));

    await ctx.app.inject({
      method: 'POST',
      url: '/auth/password-reset/request',
      payload: { email: EMAIL },
    });

    const confirmed = await ctx.app.inject({
      method: 'POST',
      url: '/auth/password-reset/confirm',
      payload: { token: ctx.mailer.lastToken(), password: 'a-brand-new-password' },
    });

    expect(confirmed.statusCode).toBe(200);
    await expect(refresh(cookie)).resolves.toMatchObject({ statusCode: 401 });
    await expect(login(EMAIL, PASSWORD)).resolves.toMatchObject({ statusCode: 401 });
    await expect(login(EMAIL, 'a-brand-new-password')).resolves.toMatchObject({ statusCode: 200 });
  });

  it('refuses to reuse a reset token', async () => {
    await registerAndVerify();
    await ctx.app.inject({
      method: 'POST',
      url: '/auth/password-reset/request',
      payload: { email: EMAIL },
    });

    const token = ctx.mailer.lastToken();
    const payload = { token, password: 'a-brand-new-password' };

    await ctx.app.inject({ method: 'POST', url: '/auth/password-reset/confirm', payload });
    const second = await ctx.app.inject({
      method: 'POST',
      url: '/auth/password-reset/confirm',
      payload,
    });

    expect(second.statusCode).toBe(401);
  });
});

describe('protected routes', () => {
  it('rejects a missing or malformed token', async () => {
    await expect(ctx.app.inject({ method: 'GET', url: '/auth/me' })).resolves.toMatchObject({
      statusCode: 401,
    });

    const bad = await ctx.app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: 'Bearer not-a-jwt' },
    });

    expect(bad.statusCode).toBe(401);
  });

  it('returns the caller identity and resolved permissions', async () => {
    await registerAndVerify();
    const { accessToken } = sessionResponseSchema.parse((await login()).json());

    const response = await ctx.app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);

    const body = z
      .object({ role: z.string(), permissions: z.array(z.string()) })
      .parse(response.json());

    expect(body.role).toBe('OWNER');
    expect(body.permissions).toContain('billing:manage');
  });
});
