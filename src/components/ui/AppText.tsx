import { Text, type TextProps } from 'react-native';
import { typography } from '@/theme';

type Variant = keyof typeof typography;

export function AppText({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <Text style={[typography[variant], style]} {...rest} />;
}
