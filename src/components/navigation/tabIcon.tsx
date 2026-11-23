import { Icon, type IconName } from '@/components/common';

/** For Tabs screenOptions: tabBarIcon: tabIcon('home-outline', 'home') */
export const tabIcon =
  (name: IconName, focusedName?: IconName) =>
  ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Icon name={focused && focusedName ? focusedName : name} color={color} size={size} />
  );
