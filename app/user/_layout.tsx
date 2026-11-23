import { Tabs } from 'expo-router';
import { RoleGate } from '@/auth/RoleGate';
import { tabIcon, useTabScreenOptions } from '@/components/navigation';

export default function UserLayout() {
  const screenOptions = useTabScreenOptions();
  return (
    <RoleGate allow={['user']}>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home-outline', 'home') }} />
        <Tabs.Screen name="pets" options={{ title: 'My Pets', tabBarIcon: tabIcon('paw-outline', 'paw') }} />
        <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: tabIcon('calendar-blank-outline', 'calendar-blank') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('account-outline', 'account') }} />
      </Tabs>
    </RoleGate>
  );
}
