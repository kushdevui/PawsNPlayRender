import { Pressable, View } from 'react-native';
import { HelperText, TextInput as PaperTextInput } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import type { IconName } from './Icon';

interface Props {
  label: string;
  /** Text to show (already formatted). Empty = shows placeholder. */
  displayValue: string;
  placeholder?: string;
  onPress: () => void;
  icon?: IconName;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

/** Read-only field that looks exactly like TextInput and opens a picker. Base for Date/Time/Select fields. */
export function PickerField({ label, displayValue, placeholder, onPress, icon = 'menu-down', error, helperText, disabled }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const message = error || helperText;
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={`${label}: ${displayValue || placeholder || 'not set'}`}>
        <View pointerEvents="none">
          <PaperTextInput
            mode="outlined"
            label={label}
            value={displayValue}
            placeholder={placeholder}
            editable={false}
            disabled={disabled}
            error={!!error}
            outlineColor={theme.colors.border}
            textColor={theme.colors.text}
            placeholderTextColor={theme.colors.placeholder}
            outlineStyle={styles.outline}
            style={styles.input}
            right={<PaperTextInput.Icon icon={icon} color={theme.colors.textMuted} />}
          />
        </View>
      </Pressable>
      {!!message && (
        <HelperText type={error ? 'error' : 'info'} visible padding="none" style={styles.helper}>
          {message}
        </HelperText>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { alignSelf: 'stretch' },
  input: { backgroundColor: t.colors.surface, fontSize: t.fontSize.md },
  outline: { borderRadius: t.radius.md },
  helper: { paddingHorizontal: t.spacing.xs },
}));
