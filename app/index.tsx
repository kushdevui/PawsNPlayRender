// Entry: send people to login or to their role's home.
import { Redirect } from 'expo-router';
import { useSession } from '@/auth/session';
import { homeRouteFor } from '@/auth/roles';

export default function Index() {
  const user = useSession((s) => s.user);
  return <Redirect href={user ? homeRouteFor(user.role) : '/login'} />;
}
