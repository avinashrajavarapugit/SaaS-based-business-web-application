import { PrismaPg } from '@prisma/adapter-pg';
import type { FastifyInstance } from 'fastify';

import type { Mailer } from '../src/auth/mailer.js';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { TEST_DATABASE_URL } from './global-setup.js';

export interface SentMail {
  to: string;
  subject: string;
  body: string;
}

export interface TestMailer extends Mailer {
  sent: SentMail[];
  lastToken(): string;
}

export function createTestMailer(): TestMailer {
  const sent: SentMail[] = [];

  return {
    sent,
    send(to, subject, body) {
      sent.push({ to, subject, body });
      return Promise.resolve();
    },
    lastToken() {
      const last = sent.at(-1);

      if (!last) throw new Error('No mail was sent');

      const match = /token=([^\s&]+)/.exec(last.body);

      if (!match?.[1]) throw new Error(`No token in mail body: ${last.body}`);

      return decodeURIComponent(match[1]);
    },
  };
}

export interface TestContext {
  app: FastifyInstance;
  prisma: PrismaClient;
  mailer: TestMailer;
  close: () => Promise<void>;
}

export async function createTestContext(): Promise<TestContext> {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: TEST_DATABASE_URL,
    JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
  });

  const mailer = createTestMailer();
  const app = await buildApp(env, { mailer });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL }),
  });

  return {
    app,
    prisma,
    mailer,
    close: async () => {
      await app.close();
      await prisma.$disconnect();
    },
  };
}

/** Order matters: children before parents, because of foreign keys. */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "RefreshToken", "VerificationToken", "Document", "Invite", "Membership", "Organization", "User" RESTART IDENTITY CASCADE',
  );
}

export function refreshCookieFrom(headers: unknown): string | undefined {
  const raw = (headers as Record<string, unknown>)['set-cookie'];
  const cookies = Array.isArray(raw) ? (raw as string[]) : typeof raw === 'string' ? [raw] : [];
  const match = cookies.find((c) => c.startsWith('refresh_token='));

  return match?.split(';')[0]?.split('=')[1];
}
