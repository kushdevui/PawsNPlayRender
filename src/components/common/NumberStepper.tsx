import { View } from 'react-native';
import { IconButton, TextInput as PaperTextInput } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';

interface Props {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Text after the number, e.g. "dogs". */
  unit?: string;
  helperText?: string;
  error?: string;
}

/** − [ 15 ] + whole-number input (Paper IconButtons + TextInput). */
export function NumberStepper({ label, value, onChange, min = 0, max = 9999, step = 1, unit, helperText, error }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <View style={styles.wrap}>
      {!!label && <AppText variant="label">{label}</AppText>}
      <View style={styles.row}>
        <IconButton
          icon="minus"
          mode="outlined"
          size={22}
          disabled={value <= min}
          onPress={() => onChange(clamp(value - step))}
          accessibilityLabel={`Decrease ${label ?? 'value'}`}
          style={styles.btn}
          iconColor={theme.colors.text}
        />
        <PaperTextInput
          mode="outlined"
          value={String(value)}
          onChangeText={(t) => {
            const n = parseInt(t.replace(/\D/g, ''), 10);
            onChange(Number.isNaN(n) ? min : clamp(n));
          }}
          keyboardType="number-pad"
          textAlign="center"
          error={!!error}
          outlineColor={theme.colors.border}
          activeOutlineColor={theme.colors.secondary}
          outlineStyle={styles.outline}
          style={styles.input}
          contentStyle={styles.inputContent}
          accessibilityLabel={label}
        />
        <IconButton
          icon="plus"
          mode="outlined"
          size={22}
          disabled={value >= max}
          onPress={() => onChange(clamp(value + step))}
          accessibilityLabel={`Increase ${label ?? 'value'}`}
          style={styles.btn}
          iconColor={theme.colors.text}
        />
        {!!unit && <AppText variant="body" color="textMuted">{unit}</AppText>}
      </View>
      {!!(error || helperText) && (
        <AppText variant="caption" color={error ? 'danger' : 'textMuted'}>{error || helperText}</AppText>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  btn: { borderColor: t.colors.borderStrong, margin: 0 },
  input: { width: 88, backgroundColor: t.colors.surface, fontSize: t.fontSize.xl, fontWeight: t.fontWeight.bold },
  inputContent: { textAlign: 'center' },
  outline: { borderRadius: t.radius.md },
}));
