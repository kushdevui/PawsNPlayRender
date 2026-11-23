// Add / edit a dog. Used by admin/dog/new and admin/dog/[id].
import { useState } from 'react';
import { View } from 'react-native';
import type { Dog, DogDocument, DogInput, Gender, Temperament } from '@/api/types';
import { AppText, Button, DateField, Divider, InlineAlert, SegmentedControl, SwitchField, TextInput } from '@/components/common';
import { makeStyles } from '@/theme';
import { toDateKey } from '@/utils/date';
import { genderOptions, temperamentOptions } from './options';
import { VaccinationDocs } from './VaccinationDocs';

interface Props {
  initial?: Dog;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (input: DogInput) => Promise<unknown>;
}

type Errors = Partial<Record<'name' | 'ownerName' | 'ownerPhone' | 'weightKg', string>>;

export function DogForm({ initial, submitLabel, submitting, onSubmit }: Props) {
  const styles = useStyles();
  const [f, setF] = useState({
    name: initial?.name ?? '',
    breed: initial?.breed ?? '',
    gender: (initial?.gender ?? 'male') as Gender,
    dateOfBirth: initial?.dateOfBirth ?? null,
    weightKg: initial?.weightKg != null ? String(initial.weightKg) : '',
    color: initial?.color ?? '',
    ownerName: initial?.ownerName ?? '',
    ownerPhone: initial?.ownerPhone ?? '',
    vaccinated: initial?.vaccinated ?? false,
    vaccinationExpiry: initial?.vaccinationExpiry ?? null,
    neutered: initial?.neutered ?? false,
    temperament: (initial?.temperament ?? 'friendly') as Temperament,
    feedingNotes: initial?.feedingNotes ?? '',
    medicalNotes: initial?.medicalNotes ?? '',
    notes: initial?.notes ?? '',
    documents: (initial?.documents ?? []) as DogDocument[],
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof typeof f>(key: K) => (value: (typeof f)[K]) => {
    setF((x) => ({ ...x, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async () => {
    const weight = f.weightKg.trim() === '' ? null : Number(f.weightKg);
    const e: Errors = {
      name: !f.name.trim() ? 'Enter the dog’s name' : undefined,
      ownerName: !f.ownerName.trim() ? 'Enter the owner’s name' : undefined,
      ownerPhone: f.ownerPhone.replace(/\D/g, '').length < 10 ? 'Enter a valid phone number' : undefined,
      weightKg: weight !== null && (Number.isNaN(weight) || weight <= 0) ? 'Enter weight in kg' : undefined,
    };
    setErrors(e);
    setFormError(null);
    if (Object.values(e).some(Boolean)) return;
    try {
      await onSubmit({
        ...f,
        name: f.name.trim(),
        breed: f.breed.trim(),
        color: f.color.trim(),
        ownerName: f.ownerName.trim(),
        ownerPhone: f.ownerPhone.trim(),
        weightKg: weight,
        vaccinationExpiry: f.vaccinated ? f.vaccinationExpiry : null,
      });
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  return (
    <View style={styles.form}>
      {!!formError && <InlineAlert message={formError} />}

      <AppText variant="label" color="textMuted">DOG</AppText>
      <TextInput label="Name" value={f.name} onChangeText={set('name')} error={errors.name} autoCapitalize="words" />
      <TextInput label="Breed" value={f.breed} onChangeText={set('breed')} autoCapitalize="words" placeholder="e.g. Indie, Labrador" />
      <SegmentedControl label="Gender" value={f.gender} onChange={set('gender')} options={genderOptions} />
      <View style={styles.row}>
        <View style={styles.cell}><DateField label="Date of birth" value={f.dateOfBirth} onChange={set('dateOfBirth')} placeholder="Optional" /></View>
        <View style={styles.cell}><TextInput label="Weight (kg)" value={f.weightKg} onChangeText={(v) => set('weightKg')(v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" error={errors.weightKg} /></View>
      </View>
      <TextInput label="Colour" value={f.color} onChangeText={set('color')} placeholder="Optional" />
      <SegmentedControl label="Temperament" value={f.temperament} onChange={set('temperament')} options={temperamentOptions} />

      <Divider />
      <AppText variant="label" color="textMuted">OWNER</AppText>
      <TextInput label="Owner name" value={f.ownerName} onChangeText={set('ownerName')} error={errors.ownerName} leftIcon="account-outline" autoCapitalize="words" />
      <TextInput label="Owner phone" value={f.ownerPhone} onChangeText={set('ownerPhone')} error={errors.ownerPhone} leftIcon="phone-outline" keyboardType="phone-pad" />

      <Divider />
      <AppText variant="label" color="textMuted">HEALTH & CARE</AppText>
      <SwitchField label="Vaccinated" description="Rabies and core vaccines up to date" value={f.vaccinated} onChange={set('vaccinated')} />
      {f.vaccinated && (
        <DateField
          label="Vaccination valid until"
          value={f.vaccinationExpiry}
          onChange={set('vaccinationExpiry')}
          minDate={toDateKey(new Date())}
          placeholder="Optional"
        />
      )}
      <AppText variant="label">Vaccination records</AppText>
      <VaccinationDocs documents={f.documents} onChange={set('documents')} />
      <SwitchField label="Neutered / spayed" value={f.neutered} onChange={set('neutered')} />
      <TextInput label="Feeding instructions" value={f.feedingNotes} onChangeText={set('feedingNotes')} multiline placeholder="Food, quantity, times" />
      <TextInput label="Medical notes" value={f.medicalNotes} onChangeText={set('medicalNotes')} multiline placeholder="Allergies, medicines, conditions" />
      <TextInput label="Other notes" value={f.notes} onChangeText={set('notes')} multiline />

      <Button title={submitLabel} onPress={submit} loading={submitting} fullWidth size="lg" style={styles.submit} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  form: { gap: t.spacing.md },
  row: { flexDirection: 'row', gap: t.spacing.md },
  cell: { flex: 1 },
  submit: { marginTop: t.spacing.sm },
}));
