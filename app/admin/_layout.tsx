import { Tabs } from 'expo-router';
import { RoleGate } from '@/auth/RoleGate';
import { tabIcon, useTabScreenOptions } from '@/components/navigation';

export default function AdminLayout() {
  const screenOptions = useTabScreenOptions();
  return (
    <RoleGate allow={['admin']}>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: tabIcon('view-dashboard-outline', 'view-dashboard') }} />
        <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: tabIcon('calendar-blank-outline', 'calendar-blank') }} />
        <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: tabIcon('account-group-outline', 'account-group') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('account-outline', 'account') }} />
      </Tabs>
    </RoleGate>
  );
}
