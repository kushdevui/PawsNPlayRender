// UI checks permissions, never raw role strings. The backend still enforces access.
import type { Role } from '@/api/types';
import { useSession } from './session';

export type Permission =
  | 'dashboard.view'
  | 'dogs.view'
  | 'dogs.manage'
  | 'bookings.view'
  | 'bookings.manage' // create / edit / cancel
  | 'bookings.checkInOut'
  | 'settings.manage'
  | 'users.manage';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['dashboard.view', 'dogs.view', 'dogs.manage', 'bookings.view', 'bookings.manage', 'bookings.checkInOut', 'settings.manage', 'users.manage'],
  staff: ['dashboard.view', 'dogs.view', 'bookings.view', 'bookings.checkInOut'],
  user: [],
};

export const hasPermission = (role: Role | undefined, permission: Permission) =>
  !!role && rolePermissions[role].includes(permission);

export const usePermission = () => {
  const role = useSession((s) => s.user?.role);
  return (permission: Permission) => hasPermission(role, permission);
};
