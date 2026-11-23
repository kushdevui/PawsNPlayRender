// Admin dashboard: key numbers + upcoming bookings.
import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Card, Screen, StateView, bookingStatusTone } from '@/components/ui';
import { useDashboard } from '@/features/admin/hooks';
import { useBookingLabels } from '@/features/bookings/hooks';
import { colors, spacing } from '@/theme';
import { formatDateTime, formatPrice } from '@/utils/format';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={styles.stat}>
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText variant="caption">{label}</AppText>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, error, refetch } = useDashboard();
  const labels = useBookingLabels();

  if (isLoading || error || !data) {
    return (
      <Screen>
        <StateView loading={isLoading} error={error} onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title">Dashboard</AppText>
      <View style={styles.grid}>
        <Stat label="Pet parents" value={data.totalUsers} />
        <Stat label="Staff" value={data.totalStaff} />
        <Stat label="Pets" value={data.totalPets} />
        <Stat label="Revenue (completed)" value={formatPrice(data.revenue.amount, data.revenue.currency)} />
        <Stat label="Pending" value={data.bookingsByStatus.pending} />
        <Stat label="Confirmed" value={data.bookingsByStatus.confirmed} />
      </View>

      <AppText variant="heading">Upcoming bookings</AppText>
      {data.upcomingBookings.length === 0 && <AppText variant="caption">No upcoming bookings.</AppText>}
      {data.upcomingBookings.map((b) => (
        <Card key={b.id}>
          <View style={styles.row}>
            <AppText style={styles.bold}>{labels.service(b.serviceId)} · {labels.pet(b.petId)}</AppText>
            <Badge label={b.status} tone={bookingStatusTone[b.status]} />
          </View>
          <AppText variant="caption">{formatDateTime(b.startTime)}{b.staffId ? '' : ' · unassigned'}</AppText>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: { flexBasis: '47%', flexGrow: 1 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.primaryDark },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  bold: { fontWeight: '600', flexShrink: 1 },
});
