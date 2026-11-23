// Dog detail: stays (past and upcoming), new booking, edit profile, archive/restore.
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { AppText, Avatar, Badge, Button, Card, InfoRow, InlineAlert, Screen, SectionHeader, StateView } from '@/components/common';
import { BookingCard } from '@/features/bookings/BookingCard';
import { useBookings } from '@/features/bookings/hooks';
import { DogForm } from '@/features/dogs/DogForm';
import { DogHistorySummary } from '@/features/dogs/DogHistorySummary';
import { VaccinationDocs } from '@/features/dogs/VaccinationDocs';
import { useDog, useUpdateDog } from '@/features/dogs/hooks';
import { temperamentLabel, temperamentTone } from '@/features/dogs/options';
import { makeStyles } from '@/theme';
import { formatDateLong, fromDateKey } from '@/utils/date';
import { ageFrom } from '@/utils/format';

export default function DogDetail() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: dog, isLoading, error, refetch } = useDog(id);
  const bookings = useBookings({ dogId: id });
  const update = useUpdateDog(id);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading || error || !dog) {
    return (
      <Screen>
        <StateView loading={isLoading} error={error} onRetry={refetch} />
      </Screen>
    );
  }

  const archived = dog.status === 'archived';
  const toggleArchive = () => {
    const doIt = () => {
      setActionError(null);
      update.mutate({ status: archived ? 'active' : 'archived' }, { onError: (e) => setActionError(e.message) });
    };
    if (archived) return doIt();
    Alert.alert('Archive dog?', `${dog.name} will be hidden from lists and new bookings. You can restore later.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: doIt },
    ]);
  };

  const all = bookings.data?.data ?? [];
  const active = all
    .filter((b) => b.status === 'checked_in' || b.status === 'confirmed' || b.status === 'pending')
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const past = all
    .filter((b) => b.status === 'checked_out' || b.status === 'cancelled')
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));

  if (editing) {
    return (
      <Screen scroll keyboardAware edges={['bottom']}>
        <Stack.Screen options={{ title: `Edit ${dog.name}` }} />
        <DogForm
          initial={dog}
          submitLabel="Save changes"
          submitting={update.isPending}
          onSubmit={async (input) => {
            await update.mutateAsync(input);
            setEditing(false);
          }}
        />
        <Button title="Discard changes" variant="ghost" fullWidth onPress={() => setEditing(false)} />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['bottom']}>
      <Stack.Screen options={{ title: dog.name }} />

      <View style={styles.header}>
        <Avatar name={dog.name} imageUrl={dog.photoUrl} size={72} />
        <View style={styles.headerText}>
          <AppText variant="heading">{dog.name}</AppText>
          <AppText variant="caption">{[dog.breed, dog.gender === 'male' ? 'Male' : 'Female', ageFrom(dog.dateOfBirth)].filter(Boolean).join(' · ')}</AppText>
          <View style={styles.badges}>
            <Badge label={temperamentLabel[dog.temperament]} tone={temperamentTone[dog.temperament]} />
            {archived && <Badge label="Archived" />}
          </View>
        </View>
      </View>

      {!archived && (
        <Button title={`New booking for ${dog.name}`} icon="calendar-plus" fullWidth onPress={() => router.push({ pathname: '/admin/booking/new', params: { dogId: dog.id } })} />
      )}

      <Card>
        <AppText variant="label" color="textMuted">OWNER</AppText>
        <InfoRow icon="account-outline" label="Name" value={dog.ownerName} />
        <InfoRow icon="phone-outline" label="Phone" value={dog.ownerPhone} />
      </Card>

      <Card>
        <AppText variant="label" color="textMuted">HEALTH & CARE</AppText>
        <InfoRow icon="needle" label="Vaccinated" value={dog.vaccinated ? `Yes${dog.vaccinationExpiry ? ` · until ${formatDateLong(fromDateKey(dog.vaccinationExpiry))}` : ''}` : 'No'} />
        <InfoRow icon="weight-kilogram" label="Weight" value={dog.weightKg != null ? `${dog.weightKg} kg` : null} />
        <InfoRow icon="palette-outline" label="Colour" value={dog.color} />
        <InfoRow icon="content-cut" label="Neutered" value={dog.neutered ? 'Yes' : 'No'} />
        <InfoRow icon="food-drumstick-outline" label="Feeding" value={dog.feedingNotes} />
        <InfoRow icon="medical-bag" label="Medical" value={dog.medicalNotes} />
        {!!dog.notes && <InfoRow icon="note-text-outline" label="Notes" value={dog.notes} />}
      </Card>

      <Card>
        <AppText variant="label" color="textMuted">VACCINATION RECORDS</AppText>
        <VaccinationDocs documents={dog.documents ?? []} />
      </Card>

      {!!actionError && <InlineAlert message={actionError} />}
      <View style={styles.actions}>
        <Button title="Edit" icon="pencil-outline" variant="outline" onPress={() => setEditing(true)} style={styles.flex} fullWidth />
        <Button
          title={archived ? 'Restore' : 'Archive'}
          icon={archived ? 'archive-arrow-up-outline' : 'archive-outline'}
          variant={archived ? 'outline' : 'danger'}
          onPress={toggleArchive}
          loading={update.isPending}
          style={styles.flex}
          fullWidth
        />
      </View>

      {bookings.isLoading ? (
        <StateView loading />
      ) : (
        <>
          <DogHistorySummary bookings={all} />
          <SectionHeader title="Current & upcoming" count={active.length} />
          {active.length === 0 && <AppText variant="caption">No current or upcoming stays.</AppText>}
          {active.map((b) => (
            <BookingCard key={b.id} booking={b} onPress={() => router.push({ pathname: '/admin/booking/[id]', params: { id: b.id } })} />
          ))}
          <SectionHeader title="Past stays" count={past.length} />
          {past.length === 0 && <AppText variant="caption">No past stays yet.</AppText>}
          {past.map((b) => (
            <BookingCard key={b.id} booking={b} onPress={() => router.push({ pathname: '/admin/booking/[id]', params: { id: b.id } })} />
          ))}
        </>
      )}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', gap: t.spacing.lg, alignItems: 'center' },
  headerText: { flex: 1, gap: t.spacing.xxs },
  badges: { flexDirection: 'row', gap: t.spacing.xs, marginTop: t.spacing.xs },
  actions: { flexDirection: 'row', gap: t.spacing.md },
  flex: { flex: 1 },
}));
