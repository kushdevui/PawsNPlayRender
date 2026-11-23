import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Helper for Tabs screenOptions: tabBarIcon: tabIcon('home') */
export const tabIcon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;
