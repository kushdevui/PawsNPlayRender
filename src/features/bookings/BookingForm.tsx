// Create / edit a boarding stay. Used by admin/booking/new and admin/booking/[id].
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { Booking, BookingInput } from '@/api/types';
import { AppText, Button, Card, DateField, InlineAlert, SelectField, TextInput, TimeField } from '@/components/common';
import { useDogs } from '@/features/dogs/hooks';
import { useSettings } from '@/features/dashboard/hooks';
import { makeStyles } from '@/theme';
import { combineDateTime, nightsBetween, toDateKey, toTimeKey } from '@/utils/date';
import { formatPrice, plural } from '@/utils/format';

interface Props {
  initial?: Booking;
  /** Pre-select a dog / check-in date (e.g. from a dog page or the bookings filter). */
  defaultDogId?: string;
  defaultDate?: string;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (input: BookingInput) => Promise<unknown>;
  /** Lock the dog (after check-in it cannot change). */
  dogLocked?: boolean;
}

type Errors = Partial<Record<'dogId' | 'checkInDate' | 'checkInTime' | 'checkOutDate' | 'checkOutTime' | 'pricePerNight', string>>;

export function BookingForm({ initial, defaultDogId, defaultDate, submitLabel, submitting, onSubmit, dogLocked }: Props) {
  const styles = useStyles();
  const dogs = useDogs({ status: 'active' });
  const settings = useSettings();

  const [dogId, setDogId] = useState<string | null>(initial?.dogId ?? defaultDogId ?? null);
  const [checkInDate, setCheckInDate] = useState<string | null>(initial ? toDateKey(new Date(initial.checkIn)) : defaultDate ?? null);
  const [checkInTime, setCheckInTime] = useState<string | null>(initial ? toTimeKey(new Date(initial.checkIn)) : null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(initial ? toDateKey(new Date(initial.checkOut)) : null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(initial ? toTimeKey(new Date(initial.checkOut)) : null);
  const [price, setPrice] = useState(initial ? String(initial.pricePerNight) : '');
  const [kennel, setKennel] = useState(initial?.kennel ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Defaults from facility settings once loaded.
  const s = settings.data;
  const inTime = checkInTime ?? s?.defaultCheckInTime ?? null;
  const outTime = checkOutTime ?? s?.defaultCheckOutTime ?? null;
  const pricePerNight = price !== '' ? Number(price) : s?.pricePerNight ?? 0;

  const dogOptions = useMemo(() => {
    const opts = (dogs.data?.data ?? []).map((d) => ({ value: d.id, label: d.name, description: `${d.breed} · ${d.ownerName}` }));
    // Keep the current dog selectable even if it was archived after booking.
    if (initial?.dog && !opts.some((o) => o.value === initial.dogId)) {
      opts.push({ value: initial.dogId, label: initial.dog.name, description: `${initial.dog.breed} · ${initial.dog.ownerName}` });
    }
    return opts;
  }, [dogs.data, initial]);

  const stay =
    checkInDate && checkOutDate && inTime && outTime
      ? { checkIn: combineDateTime(checkInDate, inTime), checkOut: combineDateTime(checkOutDate, outTime) }
      : null;
  const nights = stay ? nightsBetween(stay.checkIn, stay.checkOut) : 0;
  const stayValid = !!stay && new Date(stay.checkOut) > new Date(stay.checkIn);

  const validate = (): Errors => ({
    dogId: !dogId ? 'Choose a dog' : undefined,
    checkInDate: !checkInDate ? 'Choose check-in date' : undefined,
    checkInTime: !inTime ? 'Choose time' : undefined,
    checkOutDate: !checkOutDate ? 'Choose check-out date' : stay && !stayValid ? 'Must be after check-in' : undefined,
    checkOutTime: !outTime ? 'Choose time' : undefined,
    pricePerNight: !(pricePerNight >= 0) || Number.isNaN(pricePerNight) ? 'Enter a valid price' : undefined,
  });

  const submit = async () => {
    const e = validate();
    setErrors(e);
    setFormError(null);
    if (Object.values(e).some(Boolean) || !stay) return;
    try {
      await onSubmit({ dogId: dogId!, ...stay, pricePerNight, kennel: kennel.trim() || null, notes: notes.trim() });
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  return (
    <View style={styles.form}>
      {!!formError && <InlineAlert message={formError} />}

      <SelectField
        label="Dog"
        value={dogId}
        options={dogOptions}
        onChange={(v) => {
          setDogId(v);
          setErrors((x) => ({ ...x, dogId: undefined }));
        }}
        searchable
        placeholder={dogs.isLoading ? 'Loading dogs…' : 'Choose a dog'}
        emptyText="No dogs found. Add the dog first."
        error={errors.dogId}
        disabled={dogLocked}
        helperText={dogLocked ? 'Dog cannot change after check-in' : undefined}
      />
      {!dogLocked && (
        <Button title="+ Add a new dog" variant="link" onPress={() => router.push('/admin/dog/new')} />
      )}

      <AppText variant="label" style={styles.sectionLabel}>Check-in</AppText>
      <View style={styles.row}>
        <View style={styles.cell}>
        <DateField
          label="Date"
          value={checkInDate}
          onChange={(v) => {
            setCheckInDate(v);
            if (checkOutDate && checkOutDate < v) setCheckOutDate(null);
            setErrors((x) => ({ ...x, checkInDate: undefined }));
          }}
          error={errors.checkInDate}
        />
        </View>
        <View style={styles.cell}>
          <TimeField label="Time" value={inTime} onChange={setCheckInTime} error={errors.checkInTime} />
        </View>
      </View>

      <AppText variant="label" style={styles.sectionLabel}>Check-out</AppText>
      <View style={styles.row}>
        <View style={styles.cell}>
        <DateField
          label="Date"
          value={checkOutDate}
          onChange={(v) => {
            setCheckOutDate(v);
            setErrors((x) => ({ ...x, checkOutDate: undefined }));
          }}
          minDate={checkInDate ?? undefined}
          rangeStart={checkInDate}
          error={errors.checkOutDate}
        />
        </View>
        <View style={styles.cell}>
          <TimeField label="Time" value={outTime} onChange={setCheckOutTime} error={errors.checkOutTime} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.cell}>
        <TextInput
          label="Price / night (₹)"
          value={price === '' && s ? String(s.pricePerNight) : price}
          onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          error={errors.pricePerNight}
        />
        </View>
        <View style={styles.cell}>
          <TextInput label="Kennel (optional)" value={kennel} onChangeText={setKennel} autoCapitalize="characters" placeholder="e.g. K-04" />
        </View>
      </View>

      <TextInput label="Notes (optional)" value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder="Feeding, medicine, pick-up person…" />

      {stayValid && (
        <Card>
          <View style={styles.summary}>
            <AppText variant="caption">{plural(nights, 'night')} × {formatPrice(pricePerNight)}</AppText>
            <AppText variant="subheading">{formatPrice(nights * pricePerNight)}</AppText>
          </View>
        </Card>
      )}

      <Button title={submitLabel} onPress={submit} loading={submitting} fullWidth size="lg" />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  form: { gap: t.spacing.md },
  row: { flexDirection: 'row', gap: t.spacing.md },
  cell: { flex: 1 },
  sectionLabel: { marginTop: t.spacing.sm },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
}));
