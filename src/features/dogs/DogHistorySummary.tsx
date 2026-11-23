// "How often has this dog stayed with us?" - totals from a dog's bookings.
import { View } from 'react-native';
import type { Booking } from '@/api/types';
import { AppText, Card } from '@/components/common';
import { makeStyles } from '@/theme';
import { formatDateLong } from '@/utils/date';
import { formatPrice } from '@/utils/format';

export function summariseStays(bookings: Booking[]) {
  const now = Date.now();
  const real = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'pending');
  const past = real.filter((b) => b.status === 'checked_out').sort((a, b) => b.checkOut.localeCompare(a.checkOut));
  const current = real.find((b) => b.status === 'checked_in');
  const next = real
    .filter((b) => b.status === 'confirmed' && new Date(b.checkIn).getTime() >= now)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];
  return {
    stays: real.length,
    nights: real.reduce((n, b) => n + b.nights, 0),
    amount: real.reduce((n, b) => n + b.totalAmount, 0),
    currency: real[0]?.currency ?? 'INR',
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    lastVisit: past[0]?.checkOut ?? null,
    current,
    next,
  };
}

export function DogHistorySummary({ bookings }: { bookings: Booking[] }) {
  const styles = useStyles();
  const s = summariseStays(bookings);
  return (
    <Card>
      <AppText variant="label" color="textMuted">STAY HISTORY</AppText>
      <View style={styles.stats}>
        <Stat value={String(s.stays)} label="Stays" />
        <Stat value={String(s.nights)} label="Nights" />
        <Stat value={formatPrice(s.amount, s.currency)} label="Total" />
      </View>
      <AppText variant="caption">
        {s.current
          ? `With us now · leaves ${formatDateLong(s.current.checkOut)}`
          : s.next
            ? `Next visit ${formatDateLong(s.next.checkIn)}`
            : 'No upcoming visit'}
        {s.lastVisit ? ` · Last visit ended ${formatDateLong(s.lastVisit)}` : ' · First-time guest'}
        {s.cancelled ? ` · ${s.cancelled} cancelled` : ''}
      </AppText>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <AppText variant="subheading">{value}</AppText>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  stats: { flexDirection: 'row', marginVertical: t.spacing.sm },
  stat: { flex: 1, gap: t.spacing.xxs },
}));
