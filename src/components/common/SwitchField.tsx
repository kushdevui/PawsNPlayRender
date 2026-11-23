import { Pressable, View } from 'react-native';
import { Switch } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';

interface Props {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

/** Labelled on/off row (Paper Switch). The whole row is tappable. */
export function SwitchField({ label, description, value, onChange, disabled }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      style={styles.row}
    >
      <View style={styles.text}>
        <AppText variant="bodyStrong">{label}</AppText>
        {!!description && <AppText variant="caption">{description}</AppText>}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} color={theme.colors.primary} />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, minHeight: t.sizes.controlMd, alignSelf: 'stretch' },
  text: { flex: 1, gap: t.spacing.xxs },
}));
