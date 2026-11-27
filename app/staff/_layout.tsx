import { Stack } from 'expo-router';
import { RoleGate } from '@/auth/RoleGate';

// Staff app - not built yet (see docs/ARCHITECTURE.md roadmap).
export default function StaffLayout() {
  return (
    <RoleGate allow={['staff']}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
