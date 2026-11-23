// Details for one day of the occupancy calendar: capacity + arriving / staying / leaving dogs.
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { Booking, OccupancyDay } from '@/api/types';
import { AppText, Badge, Button, ProgressBar, Sheet, StateView } from '@/components/common';
import { useBookings } from '@/features/bookings/hooks';
import { bookingStatusLabel, bookingStatusTone } from '@/features/bookings/status';
import { makeStyles, useTheme } from '@/theme';
import { dayRange, formatDate, formatTime, fromDateKey, toDateKey } from '@/utils/date';

interface Props {
  day: OccupancyDay;
  capacity: number;
  onDismiss: () => void;
}

export function DaySheet({ day, capacity, onDismiss }: Props) {
  const styles = useStyles();
  const date = fromDateKey(day.date);
  const { data, isLoading, error, refetch } = useBookings(dayRange(date));
  const isPast = day.date < toDateKey(new Date());

  const stays = (data?.data ?? []).filter((b) => b.status !== 'cancelled' && b.status !== 'pending');
  const onDay = (iso: string) => toDateKey(new Date(iso)) === day.date;
  const arriving = stays.filter((b) => onDay(b.checkIn));
  const leaving = stays.filter((b) => onDay(b.checkOut) && !onDay(b.checkIn));
  const staying = stays.filter((b) => !onDay(b.checkIn) && !onDay(b.checkOut));

  const open = (b: Booking) => {
    onDismiss();
    router.push({ pathname: '/admin/booking/[id]', params: { id: b.id } });
  };

  return (
    <Sheet
      visible
      onDismiss={onDismiss}
      title={formatDate(date)}
      footer={
        isPast ? undefined : (
          <Button
            title={day.available > 0 ? 'New booking from this date' : 'Full - book anyway?'}
            icon="calendar-plus"
            variant={day.available > 0 ? 'primary' : 'outline'}
            fullWidth
            onPress={() => {
              onDismiss();
              router.push({ pathname: '/admin/booking/new', params: { date: day.date } });
            }}
          />
        )
      }
    >
      <View style={styles.body}>
        <View style={styles.summary}>
          <View style={styles.between}>
            <AppText variant="heading">
              {day.occupied}
              <AppText variant="subheading" color="textMuted">{` / ${capacity} booked`}</AppText>
            </AppText>
            <Badge
              label={day.available > 0 ? `${day.available} free` : 'Full'}
              tone={day.available === 0 ? 'danger' : day.occupied / capacity >= 0.8 ? 'warning' : 'success'}
            />
          </View>
          <ProgressBar value={capacity ? day.occupied / capacity : 0} />
          <AppText variant="caption">
            {day.checkIns} arriving · {day.checkOuts} leaving · peak dogs present at the same time
          </AppText>
        </View>

        {isLoading || error ? (
          <View style={styles.loading}>
            <StateView loading={isLoading} error={error} onRetry={refetch} />
          </View>
        ) : stays.length === 0 ? (
          <AppText variant="caption" align="center" style={styles.empty}>No dogs booked on this day.</AppText>
        ) : (
          <>
            <Group title="Arriving" items={arriving} time={(b) => `In ${formatTime(b.checkIn)}`} onPress={open} />
            <Group title="Staying" items={staying} time={(b) => `Until ${formatDate(b.checkOut)}`} onPress={open} />
            <Group title="Leaving" items={leaving} time={(b) => `Out ${formatTime(b.checkOut)}`} onPress={open} />
          </>
        )}
      </View>
    </Sheet>
  );
}

function Group({ title, items, time, onPress }: { title: string; items: Booking[]; time: (b: Booking) => string; onPress: (b: Booking) => void }) {
  const theme = useTheme();
  const styles = useStyles();
  if (items.length === 0) return null;
  return (
    <View style={styles.group}>
      <AppText variant="label" color="textMuted">{`${title.toUpperCase()}  ${items.length}`}</AppText>
      {items.map((b) => (
        <Pressable
          key={b.id}
          onPress={() => onPress(b)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.item, pressed && { backgroundColor: theme.colors.surfaceMuted }]}
        >
          <View style={styles.itemText}>
            <AppText variant="bodyStrong" numberOfLines={1}>{b.dog?.name ?? 'Dog'}</AppText>
            <AppText variant="caption" numberOfLines={1}>{[time(b), b.kennel, b.dog?.ownerName].filter(Boolean).join(' · ')}</AppText>
          </View>
          <Badge label={bookingStatusLabel[b.status]} tone={bookingStatusTone[b.status]} />
        </Pressable>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.lg, paddingBottom: t.spacing.sm },
  summary: { gap: t.spacing.sm },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loading: { height: 120 },
  empty: { paddingVertical: t.spacing.lg },
  group: { gap: t.spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.sm,
    borderRadius: t.radius.md,
    borderWidth: t.sizes.borderWidth,
    borderColor: t.colors.border,
  },
  itemText: { flex: 1, gap: t.spacing.xxs },
}));
