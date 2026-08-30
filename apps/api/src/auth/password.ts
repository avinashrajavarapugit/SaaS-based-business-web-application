import { hash, verify, type Algorithm } from '@node-rs/argon2';

// Algorithm is an ambient const enum, so its value cannot be imported under
// verbatimModuleSyntax. 2 is Argon2id.
const ARGON2ID: Algorithm = 2;

// OWASP-recommended Argon2id parameters: 19 MiB memory, 2 iterations, 1 lane.
const OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, OPTIONS);
}

// Cost parameters are encoded in the digest, so verify does not take them.
export function verifyPassword(digest: string, plaintext: string): Promise<boolean> {
  return verify(digest, plaintext);
}
