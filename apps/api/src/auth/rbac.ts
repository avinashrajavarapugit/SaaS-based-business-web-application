import type { Role } from '@saas/shared';

export type Permission =
  | 'document:read'
  | 'document:write'
  | 'document:delete'
  | 'member:read'
  | 'member:invite'
  | 'member:remove'
  | 'organization:update'
  | 'organization:delete'
  | 'billing:manage';

// One table instead of role checks scattered through handlers, so the whole
// policy can be read, reviewed and tested in one place.
const GRANTS: Record<Role, readonly Permission[]> = {
  MEMBER: ['document:read', 'document:write', 'member:read'],
  ADMIN: [
    'document:read',
    'document:write',
    'document:delete',
    'member:read',
    'member:invite',
    'member:remove',
    'organization:update',
  ],
  OWNER: [
    'document:read',
    'document:write',
    'document:delete',
    'member:read',
    'member:invite',
    'member:remove',
    'organization:update',
    'organization:delete',
    'billing:manage',
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return GRANTS[role].includes(permission);
}

export function permissionsFor(role: Role): readonly Permission[] {
  return GRANTS[role];
}
