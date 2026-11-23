import type { TextProps } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme, type ThemeColors, type TypographyVariant } from '@/theme';

export interface AppTextProps extends TextProps {
  /** Typography style from our theme. Default: body */
  variant?: TypographyVariant;
  /** Semantic colour name from the theme, overrides the variant's colour. */
  color?: keyof Omit<ThemeColors, 'statusBar'>;
  align?: 'left' | 'center' | 'right';
}

/** The only text component screens should use (renders Paper's Text with our typography). */
export function AppText({ variant = 'body', color, align, style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[theme.typography[variant], color && { color: theme.colors[color] }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}
