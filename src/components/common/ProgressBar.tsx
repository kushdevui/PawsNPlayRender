import { ProgressBar as PaperProgressBar } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';

/**
 * Capacity / progress bar (Paper ProgressBar). `value` 0-1.
 * Turns warning at >= 80% and danger at 100% unless `tone` is given.
 */
export function ProgressBar({ value, tone }: { value: number; tone?: 'brand' | 'warning' | 'danger' }) {
  const theme = useTheme();
  const styles = useStyles();
  const v = Math.max(0, Math.min(1, value));
  const auto = v >= 1 ? 'danger' : v >= 0.8 ? 'warning' : 'brand';
  const color = { brand: theme.colors.primary, warning: theme.colors.warning, danger: theme.colors.danger }[tone ?? auto];
  return <PaperProgressBar progress={v} color={color} style={styles.bar} accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }} />;
}

const useStyles = makeStyles((t) => ({
  bar: { height: 10, borderRadius: t.radius.pill, backgroundColor: t.colors.surfaceMuted },
}));
