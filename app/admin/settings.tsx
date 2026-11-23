// Boarding settings: capacity, price per night, default check-in/out times, facility name.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, InlineAlert, NumberStepper, Screen, StateView, TextInput, TimeField } from '@/components/common';
import { useDashboard, useSettings, useUpdateSettings } from '@/features/dashboard/hooks';
import { makeStyles } from '@/theme';

export default function BoardingSettings() {
  const styles = useStyles();
  const settings = useSettings();
  const dashboard = useDashboard();
  const update = useUpdateSettings();

  const [form, setForm] = useState({ facilityName: '', capacity: 1, pricePerNight: '', defaultCheckInTime: '10:00', defaultCheckOutTime: '18:00' });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = settings.data;
    if (s) {
      setForm({
        facilityName: s.facilityName,
        capacity: s.capacity,
        pricePerNight: String(s.pricePerNight),
        defaultCheckInTime: s.defaultCheckInTime,
        defaultCheckOutTime: s.defaultCheckOutTime,
      });
    }
  }, [settings.data]);

  if (settings.isLoading || settings.error || !settings.data) {
    return (
      <Screen>
        <StateView loading={settings.isLoading} error={settings.error} onRetry={settings.refetch} />
      </Screen>
    );
  }

  const occupiedNow = dashboard.data?.occupiedNow ?? 0;
  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  const save = () => {
    setError(null);
    const price = Number(form.pricePerNight);
    if (form.pricePerNight === '' || Number.isNaN(price) || price < 0) return setError('Enter a valid price per night.');
    if (!form.facilityName.trim()) return setError('Enter the facility name.');
    update.mutate(
      { ...form, facilityName: form.facilityName.trim(), pricePerNight: price },
      { onSuccess: () => setSaved(true), onError: (e) => setError(e.message) },
    );
  };

  return (
    <Screen scroll keyboardAware edges={['bottom']}>
      {!!error && <InlineAlert message={error} />}
      {saved && <InlineAlert tone="success" message="Settings saved." />}

      <Card>
        <AppText variant="label" color="textMuted">CAPACITY</AppText>
        <NumberStepper
          label="Total dogs we can board at once"
          value={form.capacity}
          onChange={set('capacity')}
          min={Math.max(1, occupiedNow)}
          max={500}
          unit="dogs"
          helperText={`${occupiedNow} checked in right now.`}
        />
      </Card>

      <Card>
        <AppText variant="label" color="textMuted">BOOKING DEFAULTS</AppText>
        <View style={styles.fields}>
          <TextInput
            label="Price per night (₹)"
            value={form.pricePerNight}
            onChangeText={(v) => set('pricePerNight')(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            helperText="Pre-filled on new bookings; can be changed per booking."
          />
          <View style={styles.row}>
            <View style={styles.cell}>
              <TimeField label="Check-in time" value={form.defaultCheckInTime} onChange={set('defaultCheckInTime')} />
            </View>
            <View style={styles.cell}>
              <TimeField label="Check-out time" value={form.defaultCheckOutTime} onChange={set('defaultCheckOutTime')} />
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <AppText variant="label" color="textMuted">FACILITY</AppText>
        <TextInput label="Facility name" value={form.facilityName} onChangeText={set('facilityName')} />
      </Card>

      <Button title="Save settings" onPress={save} loading={update.isPending} fullWidth size="lg" />
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  fields: { gap: t.spacing.md, marginTop: t.spacing.sm },
  row: { flexDirection: 'row', gap: t.spacing.md },
  cell: { flex: 1 },
}));
