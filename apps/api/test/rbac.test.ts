import { describe, expect, it } from 'vitest';

import { can, permissionsFor } from '../src/auth/rbac.js';

describe('rbac', () => {
  it('lets every role read documents', () => {
    expect(can('MEMBER', 'document:read')).toBe(true);
    expect(can('ADMIN', 'document:read')).toBe(true);
    expect(can('OWNER', 'document:read')).toBe(true);
  });

  it('withholds destructive and administrative actions from members', () => {
    expect(can('MEMBER', 'document:delete')).toBe(false);
    expect(can('MEMBER', 'member:invite')).toBe(false);
    expect(can('MEMBER', 'organization:update')).toBe(false);
  });

  it('reserves billing and deletion for the owner', () => {
    expect(can('ADMIN', 'billing:manage')).toBe(false);
    expect(can('ADMIN', 'organization:delete')).toBe(false);
    expect(can('OWNER', 'billing:manage')).toBe(true);
    expect(can('OWNER', 'organization:delete')).toBe(true);
  });

  it('grants strictly more as the role escalates', () => {
    const member = new Set(permissionsFor('MEMBER'));
    const admin = new Set(permissionsFor('ADMIN'));
    const owner = new Set(permissionsFor('OWNER'));

    expect([...member].every((p) => admin.has(p))).toBe(true);
    expect([...admin].every((p) => owner.has(p))).toBe(true);
    expect(owner.size).toBeGreaterThan(admin.size);
    expect(admin.size).toBeGreaterThan(member.size);
  });
});
