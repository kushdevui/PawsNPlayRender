// All bookings: filter by month, a specific date, status - or by dog (full history across all months).
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import type { BookingStatus } from '@/api/types';
import { AppText, Button, Calendar, Chip, Fab, MonthSwitcher, Screen, SelectSheet, Sheet, StateView } from '@/components/common';
import { BookingCard } from '@/features/bookings/BookingCard';
import { useBookings } from '@/features/bookings/hooks';
import { BOOKING_STATUS_FILTERS } from '@/features/bookings/status';
import { DogHistorySummary } from '@/features/dogs/DogHistorySummary';
import { useDogOptions } from '@/features/dogs/hooks';
import { makeStyles } from '@/theme';
import { dayRange, formatDate, fromDateKey, monthRange, startOfMonth } from '@/utils/date';
import { plural } from '@/utils/format';

export default function AdminBookings() {
  const styles = useStyles();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [day, setDay] = useState<string | null>(null); // 'YYYY-MM-DD'
  const [dogId, setDogId] = useState<string | null>(null);
  const [status, setStatus] = useState<BookingStatus | undefined>();
  const [pickingDay, setPickingDay] = useState(false);
  const [pickingDog, setPickingDog] = useState(false);
  const dogOptions = useDogOptions(true);
  const dogName = dogOptions.options.find((o) => o.value === dogId)?.label;

  // Dog filter = that dog's whole history (all months). Otherwise month or single date.
  const range = dogId ? {} : day ? dayRange(fromDateKey(day)) : monthRange(month);
  const { data, isLoading, error, refetch, isRefetching } = useBookings({ ...range, status, dogId: dogId ?? undefined });
  const bookings = useMemo(() => {
    const list = data?.data ?? [];
    // Dog history reads best newest-first.
    return dogId ? [...list].sort((a, b) => b.checkIn.localeCompare(a.checkIn)) : list;
  }, [data, dogId]);
  // Unfiltered dog history for the summary card (status chips shouldn't change totals).
  const dogHistory = useBookings({ dogId: dogId ?? undefined }, { enabled: !!dogId });

  const summary = useMemo(() => {
    const checkedIn = bookings.filter((b) => b.status === 'checked_in').length;
    const upcoming = bookings.filter((b) => b.status === 'confirmed').length;
    return `${plural(bookings.length, 'booking')} · ${checkedIn} checked in · ${upcoming} upcoming`;
  }, [bookings]);

  const header = (
    <View style={styles.header}>
      <AppText variant="heading">Bookings</AppText>
      {!dogId && (
        <MonthSwitcher
          month={month}
          onChange={(m) => {
            setMonth(m);
            setDay(null);
          }}
        />
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {dogId ? (
          <Chip label={dogName ?? 'Dog'} icon="dog" selected onPress={() => setPickingDog(true)} onClose={() => setDogId(null)} />
        ) : (
          <Chip label="Dog" icon="dog" onPress={() => setPickingDog(true)} />
        )}
        {!dogId &&
          (day ? (
            <Chip label={formatDate(fromDateKey(day))} icon="calendar" selected onPress={() => setPickingDay(true)} onClose={() => setDay(null)} />
          ) : (
            <Chip label="Date" icon="calendar-search" onPress={() => setPickingDay(true)} />
          ))}
        {BOOKING_STATUS_FILTERS.map((f) => (
          <Chip key={f.label} label={f.label} selected={status === f.value} onPress={() => setStatus(f.value)} />
        ))}
      </ScrollView>
      {dogId && dogHistory.data && (
        <>
          <DogHistorySummary bookings={dogHistory.data.data} />
          <Button title="Open dog profile" variant="link" onPress={() => router.push({ pathname: '/admin/dog/[id]', params: { id: dogId } })} />
        </>
      )}
      {!isLoading && !error && <AppText variant="caption">{dogId ? `All time · ${summary}` : summary}</AppText>}
    </View>
  );

  return (
    <Screen style={styles.screen}>
      {isLoading || error || bookings.length === 0 ? (
        <>
          {header}
          <StateView
            loading={isLoading}
            error={error}
            empty={!bookings.length}
            emptyText={dogId ? 'No stays for this dog with these filters.' : day ? 'No dogs booked on this date.' : 'No bookings this month.'}
            onRetry={refetch}
          />
        </>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <BookingCard booking={item} onPress={() => router.push({ pathname: '/admin/booking/[id]', params: { id: item.id } })} />
            </View>
          )}
        />
      )}

      <Fab
        label="New booking"
        onPress={() => router.push({ pathname: '/admin/booking/new', params: { ...(day ? { date: day } : {}), ...(dogId ? { dogId } : {}) } })}
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

      <SelectSheet
        visible={pickingDog}
        onDismiss={() => setPickingDog(false)}
        title="Dog"
        options={dogOptions.options}
        value={dogId}
        onSelect={(id) => {
          setDogId(id);
          setDay(null);
        }}
        searchable
        emptyText={dogOptions.isLoading ? 'Loading dogs…' : 'No dogs found'}
      />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { paddingHorizontal: 0, paddingBottom: 0 },
  header: { paddingHorizontal: t.spacing.xl, gap: t.spacing.sm, paddingBottom: t.spacing.sm },
  chips: { gap: t.spacing.sm, paddingVertical: t.spacing.xs },
  list: { gap: t.spacing.md, paddingBottom: 96 },
  item: { paddingHorizontal: t.spacing.xl },
}));
