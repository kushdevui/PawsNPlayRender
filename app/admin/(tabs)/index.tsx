// Admin dashboard: live capacity, today's arrivals/departures, next 7 days.
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import type { Booking } from '@/api/types';
import { useSession } from '@/auth/session';
import { AppText, Badge, Button, Card, Icon, PickerField, ProgressBar, Screen, SectionHeader, SelectSheet, StateView } from '@/components/common';
import { BookingCard } from '@/features/bookings/BookingCard';
import { useSetBookingStatus } from '@/features/bookings/hooks';
import { OccupancyCalendar } from '@/features/dashboard/OccupancyCalendar';
import { useDashboard } from '@/features/dashboard/hooks';
import { useDogOptions } from '@/features/dogs/hooks';
import { useNewQuestionnairesCount } from '@/features/questionnaires/hooks';
import { useRecentWaiversCount } from '@/features/waivers/hooks';
import { CapacitySheet } from '@/features/settings/CapacitySheet';
import { makeStyles } from '@/theme';
import { formatDate } from '@/utils/date';
import { formatPrice, plural } from '@/utils/format';
import { showAlert } from '@/lib/dialog';

const openBooking = (b: Booking) => router.push({ pathname: '/admin/booking/[id]', params: { id: b.id } });

export default function AdminDashboard() {
  const styles = useStyles();
  const name = useSession((s) => s.user?.name.split(' ')[0]);
  const { data, isLoading, error, refetch, isRefetching } = useDashboard();
  const setStatus = useSetBookingStatus();
  const dogOptions = useDogOptions(true);
  const newForms = useNewQuestionnairesCount();
  const recentWaivers = useRecentWaiversCount();
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [findingDog, setFindingDog] = useState(false);

  const changeStatus = (b: Booking, status: 'checked_in' | 'checked_out') =>
    setStatus.mutate({ id: b.id, status }, { onError: (e) => showAlert('Could not update', e.message) });

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
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
              void newForms.refetch();
              void recentWaivers.refetch();
            }}
          />
        }
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
            <Button title="Edit capacity" variant="link" onPress={() => setEditingCapacity(true)} />
          </View>
          <View style={styles.capacityRow}>
            <AppText variant="display">{data.occupiedNow}</AppText>
            <AppText variant="subheading" color="textMuted"> / {data.capacity} dogs</AppText>
          </View>
          <ProgressBar value={ratio} />
          <AppText variant="caption">{plural(data.availableNow, 'kennel')} free right now</AppText>
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

        {/* Money to collect */}
        <Card onPress={() => router.push('/admin/billing')} accessibilityLabel="Payments due">
          <View style={styles.between}>
            <View>
              <AppText variant="label" color="textMuted">PAYMENTS DUE</AppText>
              <AppText variant="caption">{plural(data.paymentsDueBookings, 'booking')} · tap for billing</AppText>
            </View>
            <AppText variant="subheading">{formatPrice(data.paymentsDue)}</AppText>
          </View>
        </Card>

        {/* Know Your Dog submissions from dog parents */}
        <Card onPress={() => router.push('/admin/forms')} accessibilityLabel="Know Your Dog forms">
          <View style={styles.between}>
            <View style={styles.formsTitle}>
              <Icon name="clipboard-text-outline" color="textMuted" />
              <View style={styles.flex}>
                <AppText variant="label" color="textMuted">KNOW YOUR DOG FORMS</AppText>
                <AppText variant="caption">
                  {newForms.isLoading ? 'Checking for new forms…' : newForms.error ? 'Could not load · tap to open' : newForms.count ? 'New answers from dog parents · tap to review' : 'All reviewed · tap to see forms'}
                </AppText>
              </View>
            </View>
            {!!newForms.count && <Badge label={`${newForms.count} new`} tone="brand" />}
          </View>
        </Card>

        {/* Signed boarding waivers */}
        <Card onPress={() => router.push('/admin/waivers')} accessibilityLabel="Signed waivers">
          <View style={styles.between}>
            <View style={styles.formsTitle}>
              <Icon name="file-sign" color="textMuted" />
              <View style={styles.flex}>
                <AppText variant="label" color="textMuted">SIGNED WAIVERS</AppText>
                <AppText variant="caption">
                  {recentWaivers.isLoading ? 'Checking for new waivers…' : recentWaivers.error ? 'Could not load · tap to open' : recentWaivers.count ? 'Signed in the last 7 days · tap to see all' : 'None in the last 7 days · tap to see all'}
                </AppText>
              </View>
            </View>
            {!!recentWaivers.count && <Badge label={`${recentWaivers.count} this week`} tone="brand" />}
          </View>
        </Card>

        <View style={styles.actions}>
          <Button title="New booking" icon="calendar-plus" onPress={() => router.push('/admin/booking/new')} style={styles.flex} fullWidth />
          <Button title="Add dog" icon="paw" variant="outline" onPress={() => router.push('/admin/dog/new')} style={styles.flex} fullWidth />
        </View>

        {/* Dog lookup - opens the dog's profile with full stay history */}
        <PickerField label="Find a dog" displayValue="" placeholder="Search by dog, owner or phone" icon="magnify" onPress={() => setFindingDog(true)} />

        {/* Occupancy calendar */}
        <SectionHeader title="Occupancy calendar" />
        <OccupancyCalendar />

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

      <CapacitySheet
        visible={editingCapacity}
        onDismiss={() => setEditingCapacity(false)}
        capacity={data.capacity}
        occupiedNow={data.occupiedNow}
      />
      <SelectSheet
        visible={findingDog}
        onDismiss={() => setFindingDog(false)}
        title="Find a dog"
        options={dogOptions.options}
        value={null}
        onSelect={(id) => router.push({ pathname: '/admin/dog/[id]', params: { id } })}
        searchable
        emptyText={dogOptions.isLoading ? 'Loading dogs…' : 'No dogs found'}
      />
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
  formsTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
}));
