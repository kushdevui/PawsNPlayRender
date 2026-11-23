import { Tabs } from 'expo-router';
import { RoleGate } from '@/auth/RoleGate';
import { tabIcon } from '@/components/TabIcon';
import { colors } from '@/theme';

export default function UserLayout() {
  return (
    <RoleGate allow={['user']}>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home-outline') }} />
        <Tabs.Screen name="pets" options={{ title: 'My Pets', tabBarIcon: tabIcon('paw-outline') }} />
        <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: tabIcon('calendar-outline') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person-outline') }} />
      </Tabs>
    </RoleGate>
  );
}
