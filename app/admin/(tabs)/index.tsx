// Admin dashboard: live capacity, today's arrivals/departures, next 7 days.
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import type { Booking } from '@/api/types';
import { useSession } from '@/auth/session';
import { AppText, Button, Card, ProgressBar, Screen, SectionHeader, StateView } from '@/components/common';
import { BookingCard } from '@/features/bookings/BookingCard';
import { useSetBookingStatus } from '@/features/bookings/hooks';
import { OccupancyChart } from '@/features/dashboard/OccupancyChart';
import { useDashboard } from '@/features/dashboard/hooks';
import { makeStyles } from '@/theme';
import { formatDate } from '@/utils/date';
import { plural } from '@/utils/format';

const openBooking = (b: Booking) => router.push({ pathname: '/admin/booking/[id]', params: { id: b.id } });

export default function AdminDashboard() {
  const styles = useStyles();
  const name = useSession((s) => s.user?.name.split(' ')[0]);
  const { data, isLoading, error, refetch, isRefetching } = useDashboard();
  const setStatus = useSetBookingStatus();

  const changeStatus = (b: Booking, status: 'checked_in' | 'checked_out') =>
    setStatus.mutate({ id: b.id, status }, { onError: (e) => Alert.alert('Could not update', e.message) });

  if (isLoading || error || !data) {
    return (
      <Screen>
        <StateView loading={isLoading} error={error} onRetry={refetch} />
      </Screen>
    );
  }

  const ratio = data.capacity ? data.occupiedNow / data.capacity : 0;
  const pendingCheckIns = data.todayCheckIns.filter((b) => b.status === 'confirmed');
  const pendingCheckOuts = data.todayCheckOuts.filter((b) => b.status === 'checked_in');
  const laterUpcoming = data.upcoming.filter((b) => !data.todayCheckIns.some((t) => t.id === b.id));

  return (
    <Screen edges={['top']} style={styles.noPad}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <AppText variant="caption">{formatDate(new Date())}</AppText>
          <AppText variant="heading">Hi {name}</AppText>
        </View>

        {/* Capacity */}
        <Card>
          <View style={styles.between}>
            <AppText variant="label" color="textMuted">IN BOARDING NOW</AppText>
            <AppText variant="caption">{plural(data.availableNow, 'kennel')} free</AppText>
          </View>
          <View style={styles.capacityRow}>
            <AppText variant="display">{data.occupiedNow}</AppText>
            <AppText variant="subheading" color="textMuted"> / {data.capacity} dogs</AppText>
          </View>
          <ProgressBar value={ratio} />
        </Card>

        {/* Today at a glance */}
        <View style={styles.stats}>
          <Card style={styles.stat}>
            <AppText variant="heading">{data.todayCheckIns.length}</AppText>
            <AppText variant="caption">Check-ins today</AppText>
          </Card>
          <Card style={styles.stat}>
            <AppText variant="heading">{data.todayCheckOuts.length}</AppText>
            <AppText variant="caption">Check-outs today</AppText>
          </Card>
          <Card style={styles.stat}>
            <AppText variant="heading">{data.bookingsThisMonth}</AppText>
            <AppText variant="caption">Stays this month</AppText>
          </Card>
        </View>

        <View style={styles.actions}>
          <Button title="New booking" icon="calendar-plus" onPress={() => router.push('/admin/booking/new')} style={styles.flex} fullWidth />
          <Button title="Add dog" icon="paw" variant="outline" onPress={() => router.push('/admin/dog/new')} style={styles.flex} fullWidth />
        </View>

        {/* Next 7 days */}
        <SectionHeader title="Next 7 days" />
        <Card>
          <OccupancyChart days={data.occupancyNext7Days} capacity={data.capacity} />
          <AppText variant="caption" align="center">Dogs booked per day · capacity {data.capacity}</AppText>
        </Card>

        {/* Today */}
        <SectionHeader title="Arriving today" count={data.todayCheckIns.length} />
        {data.todayCheckIns.length === 0 && <AppText variant="caption">No check-ins today.</AppText>}
        {data.todayCheckIns.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            highlight="checkIn"
            onPress={() => openBooking(b)}
            action={pendingCheckIns.includes(b) ? { label: 'Check in', onPress: () => changeStatus(b, 'checked_in') } : undefined}
          />
        ))}

        <SectionHeader title="Leaving today" count={data.todayCheckOuts.length} />
        {data.todayCheckOuts.length === 0 && <AppText variant="caption">No check-outs today.</AppText>}
        {data.todayCheckOuts.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            highlight="checkOut"
            onPress={() => openBooking(b)}
            action={pendingCheckOuts.includes(b) ? { label: 'Check out', onPress: () => changeStatus(b, 'checked_out') } : undefined}
          />
        ))}

        <SectionHeader title="Upcoming" count={laterUpcoming.length} actionLabel="All bookings" onAction={() => router.push('/admin/bookings')} />
        {laterUpcoming.length === 0 && <AppText variant="caption">No arrivals in the next 7 days.</AppText>}
        {laterUpcoming.map((b) => (
          <BookingCard key={b.id} booking={b} highlight="checkIn" onPress={() => openBooking(b)} />
        ))}
      </ScrollView>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  noPad: { padding: 0 },
  content: { padding: t.spacing.xl, gap: t.spacing.md, paddingBottom: t.spacing.xxxl },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: t.spacing.xs },
  stats: { flexDirection: 'row', gap: t.spacing.sm },
  stat: { flex: 1 },
  actions: { flexDirection: 'row', gap: t.spacing.md },
  flex: { flex: 1 },
}));
