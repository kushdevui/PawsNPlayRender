import { Tabs } from 'expo-router';
import { RoleGate } from '@/auth/RoleGate';
import { tabIcon } from '@/components/TabIcon';
import { colors } from '@/theme';

export default function AdminLayout() {
  return (
    <RoleGate allow={['admin']}>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
        <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: tabIcon('stats-chart-outline') }} />
        <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: tabIcon('calendar-outline') }} />
        <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: tabIcon('people-outline') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person-outline') }} />
      </Tabs>
    </RoleGate>
  );
}
