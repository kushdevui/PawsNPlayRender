// Used in each role's _layout.tsx: lets the right role through, redirects everyone else.
import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import type { Role } from '@/api/types';
import { useSession } from './session';
import { homeRouteFor } from './roles';

export function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { status, user } = useSession();
  if (status !== 'signedIn' || !user) return <Redirect href="/login" />;
  if (!allow.includes(user.role)) return <Redirect href={homeRouteFor(user.role)} />;
  return <>{children}</>;
}
