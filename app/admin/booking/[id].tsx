// Booking detail: status actions (check in / out / cancel), dog care info, edit form.
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import type { Booking } from '@/api/types';
import { AppText, Badge, Button, Card, InfoRow, InlineAlert, Screen, StateView } from '@/components/common';
import { useDog } from '@/features/dogs/hooks';
import { BookingForm } from '@/features/bookings/BookingForm';
import { useBooking, useSetBookingStatus, useUpdateBooking } from '@/features/bookings/hooks';
import { bookingStatusLabel, bookingStatusTone } from '@/features/bookings/status';
import { makeStyles } from '@/theme';
import { formatDateTime } from '@/utils/date';
import { formatPrice, plural } from '@/utils/format';

export default function BookingDetail() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, error, refetch } = useBooking(id);
  const dog = useDog(booking?.dogId);
  const update = useUpdateBooking(id);
  const setStatus = useSetBookingStatus();
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading || error || !booking) {
    return (
      <Screen>
        <StateView loading={isLoading} error={error} onRetry={refetch} />
      </Screen>
    );
  }

  const run = (status: 'checked_in' | 'checked_out' | 'cancelled') => {
    setActionError(null);
    setStatus.mutate({ id: booking.id, status }, { onError: (e) => setActionError(e.message) });
  };

  const confirmCancel = () =>
    Alert.alert('Cancel booking?', `${booking.dog?.name ?? 'This dog'}'s stay will be cancelled. This cannot be undone.`, [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => run('cancelled') },
    ]);

  const editable = booking.status === 'confirmed' || booking.status === 'checked_in';

  return (
    <Screen scroll keyboardAware edges={['bottom']}>
      <Stack.Screen options={{ title: booking.dog?.name ?? 'Booking' }} />

      <Card>
        <View style={styles.between}>
          <AppText variant="heading">{booking.dog?.name}</AppText>
          <Badge label={bookingStatusLabel[booking.status]} tone={bookingStatusTone[booking.status]} />
        </View>
        <InfoRow icon="login" label="Check-in" value={formatDateTime(booking.checkIn)} />
        <InfoRow icon="logout" label="Check-out" value={formatDateTime(booking.checkOut)} />
        <InfoRow icon="weather-night" label="Stay" value={`${plural(booking.nights, 'night')} · ${formatPrice(booking.totalAmount, booking.currency)}`} />
        <InfoRow icon="home-outline" label="Kennel" value={booking.kennel} />
        {!!booking.notes && <InfoRow icon="note-text-outline" label="Notes" value={booking.notes} />}
      </Card>

      {!!actionError && <InlineAlert message={actionError} />}
      <StatusActions booking={booking} loading={setStatus.isPending} onRun={run} onCancel={confirmCancel} />

      {dog.data && (
        <Card onPress={() => router.push({ pathname: '/admin/dog/[id]', params: { id: dog.data!.id } })}>
          <AppText variant="label" color="textMuted">DOG & OWNER</AppText>
          <InfoRow icon="dog" label="Breed" value={dog.data.breed} />
          <InfoRow icon="account-outline" label="Owner" value={dog.data.ownerName} />
          <InfoRow icon="phone-outline" label="Phone" value={dog.data.ownerPhone} />
          <InfoRow icon="food-drumstick-outline" label="Feeding" value={dog.data.feedingNotes} />
          <InfoRow icon="medical-bag" label="Medical" value={dog.data.medicalNotes} />
        </Card>
      )}

      {editable &&
        (editing ? (
          <>
            <AppText variant="subheading" style={styles.editTitle}>Edit booking</AppText>
            <BookingForm
              initial={booking}
              dogLocked={booking.status === 'checked_in'}
              submitLabel="Save changes"
              submitting={update.isPending}
              onSubmit={async (input) => {
                await update.mutateAsync(input);
                setEditing(false);
              }}
            />
            <Button title="Discard changes" variant="ghost" fullWidth onPress={() => setEditing(false)} />
          </>
        ) : (
          <Button title="Edit dates or details" icon="pencil-outline" variant="outline" fullWidth onPress={() => setEditing(true)} />
        ))}
    </Screen>
  );
}

function StatusActions({
  booking, loading, onRun, onCancel,
}: { booking: Booking; loading: boolean; onRun: (s: 'checked_in' | 'checked_out') => void; onCancel: () => void }) {
  const styles = useStyles();
  if (booking.status === 'confirmed' || booking.status === 'pending') {
    return (
      <View style={styles.actions}>
        <Button title="Check in" icon="login" onPress={() => onRun('checked_in')} loading={loading} style={styles.flex} fullWidth />
        <Button title="Cancel" variant="danger" onPress={onCancel} style={styles.flex} fullWidth />
      </View>
    );
  }
  if (booking.status === 'checked_in') {
    return <Button title="Check out" icon="logout" onPress={() => onRun('checked_out')} loading={loading} fullWidth />;
  }
  return null;
}

const useStyles = makeStyles((t) => ({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.sm },
  actions: { flexDirection: 'row', gap: t.spacing.md },
  flex: { flex: 1 },
  editTitle: { marginTop: t.spacing.md },
}));
