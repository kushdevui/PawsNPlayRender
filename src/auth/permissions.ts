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
  | 'users.manage'
  | 'forms.view' // read "Know Your Dog" submissions
  | 'forms.manage' // change their status, link to a dog
  | 'waivers.view' // read signed boarding waivers
  | 'waivers.manage'; // link a waiver to a dog / Know Your Dog form

const rolePermissions: Record<Role, Permission[]> = {
  admin: ['dashboard.view', 'dogs.view', 'dogs.manage', 'bookings.view', 'bookings.manage', 'bookings.checkInOut', 'settings.manage', 'users.manage', 'forms.view', 'forms.manage', 'waivers.view', 'waivers.manage'],
  staff: ['dashboard.view', 'dogs.view', 'bookings.view', 'bookings.checkInOut', 'forms.view', 'waivers.view'],
  user: [],
};

export const hasPermission = (role: Role | undefined, permission: Permission) =>
  !!role && rolePermissions[role].includes(permission);

export const usePermission = () => {
  const role = useSession((s) => s.user?.role);
  return (permission: Permission) => hasPermission(role, permission);
};
