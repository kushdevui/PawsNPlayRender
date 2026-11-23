// UI checks permissions, never raw role strings. The backend still enforces access.
import type { Role } from '@/api/types';
import { useSession } from './session';

export type Permission =
  | 'pets.manageOwn'
  | 'pets.viewAll'
  | 'bookings.create'
  | 'bookings.cancelOwn'
  | 'bookings.approve'
  | 'bookings.assign'
  | 'bookings.complete'
  | 'services.manage'
  | 'users.manage'
  | 'dashboard.view';

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['pets.viewAll', 'bookings.approve', 'bookings.assign', 'bookings.complete', 'services.manage', 'users.manage', 'dashboard.view'],
  user: ['pets.manageOwn', 'bookings.create', 'bookings.cancelOwn'],
  staff: ['pets.viewAll', 'bookings.complete'],
};

export const hasPermission = (role: Role | undefined, permission: Permission) =>
  !!role && rolePermissions[role].includes(permission);

export const usePermission = () => {
  const role = useSession((s) => s.user?.role);
  return (permission: Permission) => hasPermission(role, permission);
};
