import { StyleSheet, Text, View } from 'react-native';
import type { BookingStatus } from '@/api/types';
import { colors, radius, spacing } from '@/theme';

const tones = {
  neutral: { bg: '#F3F4F6', fg: colors.textMuted },
  success: { bg: '#DCFCE7', fg: colors.success },
  warning: { bg: '#FEF3C7', fg: colors.warning },
  danger: { bg: '#FEE2E2', fg: colors.danger },
  info: { bg: '#DBEAFE', fg: colors.info },
};
export type BadgeTone = keyof typeof tones;

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export const bookingStatusTone: Record<BookingStatus, BadgeTone> = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'neutral',
};

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  text: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});
