// Shared bookings list for all roles. Actions shown depend on permissions.
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import type { Booking } from '@/api/types';
import { usePermission } from '@/auth/permissions';
import { useSession } from '@/auth/session';
import { AppText, Badge, Button, Card, StateView, bookingStatusTone } from '@/components/ui';
import { spacing } from '@/theme';
import { formatDateTime, formatPrice } from '@/utils/format';
import { useBookingLabels, useBookings, useUpdateBookingStatus } from './hooks';

export function BookingList({ emptyText }: { emptyText?: string }) {
  const { data, isLoading, error, refetch, isRefetching } = useBookings();
  const labels = useBookingLabels();
  const can = usePermission();
  const userId = useSession((s) => s.user?.id);
  const update = useUpdateBookingStatus();

  const run = (id: string, status: 'confirmed' | 'completed' | 'cancelled') =>
    update.mutate({ id, status }, { onError: (e) => Alert.alert('Could not update', e.message) });

  const actionsFor = (b: Booking) => {
    const open = b.status === 'pending' || b.status === 'confirmed';
    return (
      <View style={styles.actions}>
        {can('bookings.approve') && b.status === 'pending' && (
          <Button size="sm" title="Confirm" onPress={() => run(b.id, 'confirmed')} />
        )}
        {can('bookings.complete') && b.status === 'confirmed' && (
          <Button size="sm" title="Mark done" onPress={() => run(b.id, 'completed')} />
        )}
        {open && (can('bookings.approve') || (can('bookings.cancelOwn') && b.userId === userId)) && (
          <Button size="sm" variant="danger" title="Cancel" onPress={() => run(b.id, 'cancelled')} />
        )}
      </View>
    );
  };

  const state = <StateView loading={isLoading} error={error} empty={!data?.data.length} emptyText={emptyText} onRetry={refetch} />;
  if (isLoading || error || !data?.data.length) return state;

  return (
    <FlatList
      data={data.data}
      keyExtractor={(b) => b.id}
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={styles.list}
      renderItem={({ item: b }) => (
        <Card>
          <View style={styles.row}>
            <AppText variant="heading">{labels.service(b.serviceId)}</AppText>
            <Badge label={b.status} tone={bookingStatusTone[b.status]} />
          </View>
          <AppText>{labels.pet(b.petId)} · {formatDateTime(b.startTime)}</AppText>
          <AppText variant="caption">{formatPrice(b.totalPrice, b.currency)}{b.notes ? ` · ${b.notes}` : ''}</AppText>
          {actionsFor(b)}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
});
