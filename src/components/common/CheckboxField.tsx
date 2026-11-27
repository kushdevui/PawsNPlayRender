import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Checkbox, HelperText } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';

interface Props {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /** Error message shown below (e.g. "Please tick to confirm."). */
  error?: string;
  disabled?: boolean;
  /** Custom content shown instead of the label text (e.g. a numbered item with **bold** parts). `label` stays the accessibility label. */
  children?: ReactNode;
}

/** Labelled checkbox (Paper Checkbox, Android style on every platform so the box is always visible). Whole row is tappable. */
export function CheckboxField({ label, value, onChange, error, disabled, children }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange(!value)}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value, disabled }}
        accessibilityLabel={label}
        style={styles.row}
      >
        <Checkbox.Android
          status={value ? 'checked' : 'unchecked'}
          onPress={() => onChange(!value)}
          disabled={disabled}
          color={theme.colors.secondary}
          uncheckedColor={error ? theme.colors.danger : theme.colors.borderStrong}
        />
        {children ? <View style={styles.text}>{children}</View> : <AppText variant="bodyStrong" style={styles.text}>{label}</AppText>}
      </Pressable>
      {!!error && (
        <HelperText type="error" visible padding="none" style={styles.helper}>
          {error}
        </HelperText>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: t.sizes.controlMd },
  text: { flex: 1 },
  helper: { paddingHorizontal: t.spacing.xs },
}));
