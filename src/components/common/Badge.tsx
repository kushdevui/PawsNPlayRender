import { View } from 'react-native';
import type { BookingStatus } from '@/api/types';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';

const tones = {
  neutral: { bg: 'surfaceMuted', fg: 'textMuted' },
  brand: { bg: 'primarySoft', fg: 'primaryText' },
  success: { bg: 'successSoft', fg: 'success' },
  warning: { bg: 'warningSoft', fg: 'warning' },
  danger: { bg: 'dangerSoft', fg: 'danger' },
  info: { bg: 'infoSoft', fg: 'info' },
} as const;
export type BadgeTone = keyof typeof tones;

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const theme = useTheme();
  const styles = useStyles();
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: theme.colors[t.bg] }]}>
      <AppText variant="caption" color={t.fg} style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

export const bookingStatusTone: Record<BookingStatus, BadgeTone> = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'neutral',
};

const useStyles = makeStyles((t) => ({
  badge: { alignSelf: 'flex-start', paddingHorizontal: t.spacing.sm, paddingVertical: t.spacing.xxs, borderRadius: t.radius.pill },
  text: { fontWeight: t.fontWeight.semibold, fontSize: t.fontSize.xs, textTransform: 'capitalize' },
}));
