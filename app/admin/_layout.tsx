import { Stack } from 'expo-router';
import { RoleGate } from '@/auth/RoleGate';
import { useStackScreenOptions } from '@/components/navigation';

// Admin area: tabs + stack screens for forms/details on top.
// Note: don't use presentation 'modal' here - Paper pickers (Portal) would render behind iOS modals.
export default function AdminLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <RoleGate allow={['admin']}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="booking/new" options={{ title: 'New booking' }} />
        <Stack.Screen name="booking/[id]" options={{ title: 'Booking' }} />
        <Stack.Screen name="dog/new" options={{ title: 'Add dog' }} />
        <Stack.Screen name="dog/[id]" options={{ title: 'Dog' }} />
        <Stack.Screen name="settings" options={{ title: 'Boarding settings' }} />
        <Stack.Screen name="forms/index" options={{ title: 'Know Your Dog forms' }} />
        <Stack.Screen name="forms/[id]" options={{ title: 'Form' }} />
      </Stack>
    </RoleGate>
  );
}
