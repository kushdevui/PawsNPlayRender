import { Tabs } from 'expo-router';
import { tabIcon, useTabScreenOptions } from '@/components/navigation';

export default function AdminTabsLayout() {
  const screenOptions = useTabScreenOptions();
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: tabIcon('view-dashboard-outline', 'view-dashboard') }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: tabIcon('calendar-blank-outline', 'calendar-blank') }} />
      <Tabs.Screen name="dogs" options={{ title: 'Dogs', tabBarIcon: tabIcon('paw-outline', 'paw') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('account-outline', 'account') }} />
    </Tabs>
  );
}
