import { createTransport, type Transporter } from 'nodemailer';

import type { Env } from '../config/env.js';

export interface Mailer {
  send(to: string, subject: string, body: string): Promise<void>;
}

export function createMailer(env: Env): Mailer {
  const transporter: Transporter = createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // Mailpit and most local catchers speak plain SMTP on a non-TLS port.
    secure: false,
    ignoreTLS: env.NODE_ENV !== 'production',
  });

  return {
    async send(to, subject, body) {
      await transporter.sendMail({ from: env.SMTP_FROM, to, subject, text: body });
    },
  };
}

export function verificationEmail(webOrigin: string, token: string): [string, string] {
  const link = `${webOrigin}/verify-email?token=${encodeURIComponent(token)}`;
  return ['Confirm your email address', `Confirm your email address:\n\n${link}\n`];
}

export function passwordResetEmail(webOrigin: string, token: string): [string, string] {
  const link = `${webOrigin}/reset-password?token=${encodeURIComponent(token)}`;
  return [
    'Reset your password',
    `Reset your password using the link below. It expires in 30 minutes.\n\n${link}\n\n` +
      `If you did not request this, no action is needed.\n`,
  ];
}
