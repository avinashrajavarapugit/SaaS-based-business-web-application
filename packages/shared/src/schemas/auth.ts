import { z } from 'zod';

export const roleSchema = z.enum(['OWNER', 'ADMIN', 'MEMBER']);
export type Role = z.infer<typeof roleSchema>;

export const emailSchema = z.email().max(254).toLowerCase();

// NIST 800-63B favours length over composition rules, which push users towards
// predictable substitutions.
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128);

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(100),
  organizationName: z.string().trim().min(1).max(100),
});

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const verifyEmailRequestSchema = z.object({ token: z.string().min(1) });

export const requestPasswordResetSchema = z.object({ email: emailSchema });

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  emailVerified: z.boolean(),
});

export const sessionOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  role: roleSchema,
});

/** The refresh token travels in an httpOnly cookie and is never in the body. */
export const sessionResponseSchema = z.object({
  accessToken: z.string(),
  expiresInSeconds: z.number().int().positive(),
  user: sessionUserSchema,
  organization: sessionOrganizationSchema,
});

export const messageResponseSchema = z.object({ message: z.string() });

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
