import type { StyleProp, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { makeStyles, useTheme, type AppTheme } from '@/theme';
import type { IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Icon shown before the label (Material Community Icons name). */
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

type PaperMode = 'contained' | 'outlined' | 'text';

/** Maps our variants onto Paper modes + theme colours. Restyle all buttons here. */
const variantConfig = (t: AppTheme, variant: ButtonVariant): { mode: PaperMode; bg?: string; fg: string; border?: string } => {
  const c = t.colors;
  switch (variant) {
    case 'primary':
      return { mode: 'contained', bg: c.primary, fg: c.onPrimary };
    case 'secondary':
      return { mode: 'contained', bg: c.secondary, fg: c.onSecondary };
    case 'outline':
      return { mode: 'outlined', fg: c.text, border: c.borderStrong };
    case 'ghost':
      return { mode: 'text', fg: c.text };
    case 'link':
      return { mode: 'text', fg: c.primaryText };
    case 'danger':
      return { mode: 'outlined', fg: c.danger, border: c.danger };
  }
};

/** The only button screens should use. Renders React Native Paper's Button. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useStyles();
  const v = variantConfig(theme, variant);
  const isLink = variant === 'link';

  return (
    <PaperButton
      testID={testID}
      mode={v.mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      buttonColor={v.bg}
      textColor={v.fg}
      compact={isLink}
      uppercase={false}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityRole={isLink ? 'link' : 'button'}
      rippleColor={variant === 'primary' ? theme.colors.primaryPressed : undefined}
      style={[
        !isLink && styles.base,
        v.border && { borderColor: v.border },
        fullWidth ? styles.fullWidth : styles.auto,
        style,
      ]}
      contentStyle={isLink ? styles.linkContent : styles[size]}
      labelStyle={[
        theme.typography.button,
        size === 'sm' && styles.labelSm,
        isLink && [theme.typography.link, styles.linkLabel],
      ]}
    >
      {title}
    </PaperButton>
  );
}

const useStyles = makeStyles((t) => ({
  base: { borderRadius: t.radius.pill },
  auto: { alignSelf: 'flex-start' },
  fullWidth: { alignSelf: 'stretch' },
  sm: { minHeight: t.sizes.controlSm, paddingHorizontal: t.spacing.xs },
  md: { minHeight: t.sizes.controlMd, paddingHorizontal: t.spacing.sm },
  lg: { minHeight: t.sizes.controlLg, paddingHorizontal: t.spacing.md },
  labelSm: { fontSize: t.fontSize.sm, marginVertical: t.spacing.xs },
  linkContent: { minHeight: 0, paddingHorizontal: 0 },
  linkLabel: { marginHorizontal: 0, marginVertical: t.spacing.xxs, textDecorationLine: 'underline' },
}));
