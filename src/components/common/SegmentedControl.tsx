import { View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';

interface Props<V extends string> {
  label?: string;
  value: V;
  onChange: (value: V) => void;
  options: Array<{ value: V; label: string }>;
}

/** Pick one of a few options (Paper SegmentedButtons). Selected = brand pink. */
export function SegmentedControl<V extends string>({ label, value, onChange, options }: Props<V>) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      {!!label && <AppText variant="label">{label}</AppText>}
      <SegmentedButtons
        value={value}
        onValueChange={(v) => onChange(v as V)}
        buttons={options.map((o) => ({
          value: o.value,
          label: o.label,
          showSelectedCheck: false,
          checkedColor: theme.colors.onPrimary,
          uncheckedColor: theme.colors.text,
          style: [styles.button, o.value === value && { backgroundColor: theme.colors.primary }],
          labelStyle: styles.label,
        }))}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xs, alignSelf: 'stretch' },
  button: { borderColor: t.colors.border },
  label: { fontSize: t.fontSize.sm, fontWeight: t.fontWeight.semibold },
}));
