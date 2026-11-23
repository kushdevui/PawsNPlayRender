// Admin dashboard: key numbers + upcoming bookings.
import { View } from 'react-native';
import { AppText, Badge, Card, Screen, StateView, bookingStatusTone } from '@/components/common';
import { useDashboard } from '@/features/admin/hooks';
import { useBookingLabels } from '@/features/bookings/hooks';
import { makeStyles } from '@/theme';
import { formatDateTime, formatPrice } from '@/utils/format';

function Stat({ label, value }: { label: string; value: string | number }) {
  const styles = useStyles();
  return (
    <Card style={styles.stat}>
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption">{label}</AppText>
    </Card>
  );
}

export default function AdminDashboard() {
  const styles = useStyles();
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
      <AppText variant="heading">Dashboard</AppText>
      <View style={styles.grid}>
        <Stat label="Pet parents" value={data.totalUsers} />
        <Stat label="Staff" value={data.totalStaff} />
        <Stat label="Pets" value={data.totalPets} />
        <Stat label="Revenue (completed)" value={formatPrice(data.revenue.amount, data.revenue.currency)} />
        <Stat label="Pending" value={data.bookingsByStatus.pending} />
        <Stat label="Confirmed" value={data.bookingsByStatus.confirmed} />
      </View>

      <AppText variant="subheading">Upcoming bookings</AppText>
      {data.upcomingBookings.length === 0 && <AppText variant="caption">No upcoming bookings.</AppText>}
      {data.upcomingBookings.map((b) => (
        <Card key={b.id}>
          <View style={styles.row}>
            <AppText variant="bodyStrong" style={styles.shrink}>{labels.service(b.serviceId)} · {labels.pet(b.petId)}</AppText>
            <Badge label={b.status} tone={bookingStatusTone[b.status]} />
          </View>
          <AppText variant="caption">{formatDateTime(b.startTime)}{b.staffId ? '' : ' · unassigned'}</AppText>
        </Card>
      ))}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
  stat: { flexBasis: '47%', flexGrow: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.spacing.sm },
  shrink: { flexShrink: 1 },
}));
