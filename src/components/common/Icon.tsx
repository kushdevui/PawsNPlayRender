import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { useTheme, type ThemeColors } from '@/theme';

/** Material Community Icons - the same set React Native Paper uses. Browse: https://icons.expo.fyi */
export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Props {
  name: IconName;
  size?: number;
  /** Semantic colour name, or a raw colour string (e.g. from tab bar props). */
  color?: keyof Omit<ThemeColors, 'statusBar'> | (string & {});
}

/** App-wide icon. Swap the icon set here to change it everywhere. */
export function Icon({ name, size, color = 'text' }: Props) {
  const theme = useTheme();
  const resolved = color in theme.colors ? theme.colors[color as keyof ThemeColors] : color;
  return <MaterialCommunityIcons name={name} size={size ?? theme.sizes.icon} color={resolved as string} />;
}
