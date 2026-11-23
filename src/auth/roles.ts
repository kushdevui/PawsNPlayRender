import type { Role } from '@/api/types';

export type { Role };

// Where each role lands after login.
export const homeRouteFor = (role: Role) =>
  ({ admin: '/admin', user: '/user', staff: '/staff' } as const)[role];

export const roleLabel: Record<Role, string> = {
  admin: 'Admin',
  user: 'Pet Parent',
  staff: 'Staff',
};
