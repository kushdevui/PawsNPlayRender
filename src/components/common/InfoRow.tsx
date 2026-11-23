import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

/** Icon + label + value line for detail views. */
export function InfoRow({ icon, label, value }: { icon?: IconName; label: string; value?: string | number | null }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {icon && <Icon name={icon} color="textSubtle" />}
      <AppText variant="caption" style={styles.label}>{label}</AppText>
      <AppText variant="body" style={styles.value}>{value === null || value === undefined || value === '' ? '-' : String(value)}</AppText>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.sm, paddingVertical: t.spacing.xs },
  label: { width: 110 },
  value: { flex: 1 },
}));
