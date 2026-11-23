import { Tabs } from 'expo-router';
import { RoleGate } from '@/auth/RoleGate';
import { tabIcon } from '@/components/TabIcon';
import { colors } from '@/theme';

export default function StaffLayout() {
  return (
    <RoleGate allow={['staff']}>
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
        <Tabs.Screen name="index" options={{ title: 'My Schedule', tabBarIcon: tabIcon('time-outline') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person-outline') }} />
      </Tabs>
    </RoleGate>
  );
}
