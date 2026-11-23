// All bookings: filter by month, a specific date, and status.
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import type { BookingStatus } from '@/api/types';
import { AppText, Calendar, Chip, Fab, MonthSwitcher, Screen, Sheet, StateView } from '@/components/common';
import { BookingCard } from '@/features/bookings/BookingCard';
import { useBookings } from '@/features/bookings/hooks';
import { BOOKING_STATUS_FILTERS } from '@/features/bookings/status';
import { makeStyles } from '@/theme';
import { dayRange, formatDate, fromDateKey, monthRange, startOfMonth } from '@/utils/date';
import { plural } from '@/utils/format';

export default function AdminBookings() {
  const styles = useStyles();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [day, setDay] = useState<string | null>(null); // 'YYYY-MM-DD'
  const [status, setStatus] = useState<BookingStatus | undefined>();
  const [pickingDay, setPickingDay] = useState(false);

  const range = day ? dayRange(fromDateKey(day)) : monthRange(month);
  const { data, isLoading, error, refetch, isRefetching } = useBookings({ ...range, status });
  const bookings = data?.data ?? [];

  const summary = useMemo(() => {
    const checkedIn = bookings.filter((b) => b.status === 'checked_in').length;
    const upcoming = bookings.filter((b) => b.status === 'confirmed').length;
    return `${plural(bookings.length, 'booking')} · ${checkedIn} checked in · ${upcoming} upcoming`;
  }, [bookings]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="heading">Bookings</AppText>
        <MonthSwitcher
          month={month}
          onChange={(m) => {
            setMonth(m);
            setDay(null);
          }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {day ? (
            <Chip label={formatDate(fromDateKey(day))} icon="calendar" selected onPress={() => setPickingDay(true)} onClose={() => setDay(null)} />
          ) : (
            <Chip label="Pick a date" icon="calendar-search" onPress={() => setPickingDay(true)} />
          )}
          {BOOKING_STATUS_FILTERS.map((f) => (
            <Chip key={f.label} label={f.label} selected={status === f.value} onPress={() => setStatus(f.value)} />
          ))}
        </ScrollView>
        {!isLoading && !error && <AppText variant="caption">{summary}</AppText>}
      </View>

      {isLoading || error || bookings.length === 0 ? (
        <StateView
          loading={isLoading}
          error={error}
          empty={!bookings.length}
          emptyText={day ? 'No dogs booked on this date.' : 'No bookings this month.'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BookingCard booking={item} onPress={() => router.push({ pathname: '/admin/booking/[id]', params: { id: item.id } })} />
          )}
        />
      )}

      <Fab
        label="New booking"
        onPress={() => router.push({ pathname: '/admin/booking/new', params: day ? { date: day } : {} })}
      />

      <Sheet visible={pickingDay} onDismiss={() => setPickingDay(false)} title="Show bookings on">
        <Calendar
          value={day}
          onChange={(key) => {
            setDay(key);
            setMonth(startOfMonth(fromDateKey(key)));
            setPickingDay(false);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { paddingHorizontal: 0, paddingBottom: 0 },
  header: { paddingHorizontal: t.spacing.xl, gap: t.spacing.sm },
  chips: { gap: t.spacing.sm, paddingVertical: t.spacing.xs },
  list: { gap: t.spacing.md, paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.sm, paddingBottom: 96 },
}));
