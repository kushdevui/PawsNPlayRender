import { View } from 'react-native';
import type { Booking } from '@/api/types';
import { AppText, Badge, Button, Card, Icon } from '@/components/common';
import { makeStyles } from '@/theme';
import { formatStayRange, formatTime } from '@/utils/date';
import { plural } from '@/utils/format';
import { bookingStatusLabel, bookingStatusTone } from './status';

interface Props {
  booking: Booking;
  onPress?: () => void;
  /** Optional quick action, e.g. "Check in" on the dashboard. */
  action?: { label: string; onPress: () => void; loading?: boolean };
  /** Show which time matters in this context. */
  highlight?: 'checkIn' | 'checkOut';
}

/** One boarding stay in a list. */
export function BookingCard({ booking: b, onPress, action, highlight }: Props) {
  const styles = useStyles();
  return (
    <Card onPress={onPress} accessibilityLabel={`${b.dog?.name ?? 'Dog'} booking`}>
      <View style={styles.row}>
        <View style={styles.title}>
          <Icon name="dog" />
          <AppText variant="subheading" numberOfLines={1} style={styles.shrink}>{b.dog?.name ?? 'Unknown dog'}</AppText>
        </View>
        <Badge label={bookingStatusLabel[b.status]} tone={bookingStatusTone[b.status]} />
      </View>
      <AppText variant="caption" numberOfLines={1}>{[b.dog?.breed, b.dog?.ownerName].filter(Boolean).join(' · ')}</AppText>
      <View style={styles.meta}>
        <AppText variant="bodyStrong">{formatStayRange(b.checkIn, b.checkOut)}</AppText>
        <AppText variant="caption">{plural(b.nights, 'night')}{b.kennel ? ` · ${b.kennel}` : ''}</AppText>
      </View>
      <AppText variant="caption">
        {highlight === 'checkOut'
          ? `Check-out ${formatTime(b.checkOut)}`
          : highlight === 'checkIn'
            ? `Check-in ${formatTime(b.checkIn)}`
            : `In ${formatTime(b.checkIn)} · Out ${formatTime(b.checkOut)}`}
      </AppText>
      {action && (
        <Button title={action.label} size="sm" variant="secondary" onPress={action.onPress} loading={action.loading} style={styles.action} />
      )}
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.sm },
  title: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flex: 1 },
  shrink: { flexShrink: 1 },
  meta: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: t.spacing.xs },
  action: { marginTop: t.spacing.sm },
}));
