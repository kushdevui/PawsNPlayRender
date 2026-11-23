import { FAB } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import type { IconName } from './Icon';

/** Floating action button (Paper FAB) - bottom right, brand pink with black icon/label. */
export function Fab({ icon = 'plus', label, onPress }: { icon?: IconName; label?: string; onPress: () => void }) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <FAB
      icon={icon}
      label={label}
      onPress={onPress}
      color={theme.colors.onPrimary}
      style={styles.fab}
      accessibilityLabel={label ?? 'Add'}
    />
  );
}

const useStyles = makeStyles((t) => ({
  fab: { position: 'absolute', right: t.spacing.lg, bottom: t.spacing.lg, backgroundColor: t.colors.primary, borderRadius: t.radius.pill },
}));
