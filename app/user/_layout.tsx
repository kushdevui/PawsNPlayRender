import { Stack } from 'expo-router';
import { RoleGate } from '@/auth/RoleGate';

// Customer app - not built yet (see docs/ARCHITECTURE.md roadmap).
export default function UserLayout() {
  return (
    <RoleGate allow={['user']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
