import type { ColorValue } from 'react-native';
import { Icon, type IconName } from '@/components/common';

/** For Tabs screenOptions: tabBarIcon: tabIcon('home-outline', 'home') */
export const tabIcon =
  (name: IconName, focusedName?: IconName) =>
  ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Icon name={focused && focusedName ? focusedName : name} color={typeof color === 'string' ? color : 'text'} size={size} />
  );
