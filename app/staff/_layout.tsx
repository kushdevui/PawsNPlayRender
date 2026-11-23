import { Tabs } from 'expo-router';
import { RoleGate } from '@/auth/RoleGate';
import { tabIcon, useTabScreenOptions } from '@/components/navigation';

export default function StaffLayout() {
  const screenOptions = useTabScreenOptions();
  return (
    <RoleGate allow={['staff']}>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen name="index" options={{ title: 'My Schedule', tabBarIcon: tabIcon('clock-outline', 'clock') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('account-outline', 'account') }} />
      </Tabs>
    </RoleGate>
  );
}
