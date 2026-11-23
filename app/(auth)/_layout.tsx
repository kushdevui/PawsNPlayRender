import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/auth/session';
import { homeRouteFor } from '@/auth/roles';

// Logged-in users never see auth screens.
export default function AuthLayout() {
  const user = useSession((s) => s.user);
  if (user) return <Redirect href={homeRouteFor(user.role)} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
