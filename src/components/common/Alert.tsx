import { Surface } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Tone = 'error' | 'success' | 'warning' | 'info';

const toneMap: Record<Tone, { fg: 'danger' | 'success' | 'warning' | 'info'; bg: 'dangerSoft' | 'successSoft' | 'warningSoft' | 'infoSoft'; icon: IconName }> = {
  error: { fg: 'danger', bg: 'dangerSoft', icon: 'alert-circle-outline' },
  success: { fg: 'success', bg: 'successSoft', icon: 'check-circle-outline' },
  warning: { fg: 'warning', bg: 'warningSoft', icon: 'alert-outline' },
  info: { fg: 'info', bg: 'infoSoft', icon: 'information-outline' },
};

/** Inline message banner, e.g. a login error. (Not a popup - use RN Alert for dialogs.) */
export function InlineAlert({ message, tone = 'error' }: { message: string; tone?: Tone }) {
  const theme = useTheme();
  const styles = useStyles();
  const t = toneMap[tone];
  return (
    <Surface
      elevation={0}
      style={[styles.box, { backgroundColor: theme.colors[t.bg] }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon name={t.icon} color={t.fg} />
      <AppText variant="label" color={t.fg} style={styles.text}>
        {message}
      </AppText>
    </Surface>
  );
}

const useStyles = makeStyles((t) => ({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
    padding: t.spacing.md,
    borderRadius: t.radius.md,
    alignSelf: 'stretch',
  },
  text: { flex: 1 },
}));
