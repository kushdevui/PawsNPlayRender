// Field renderers for the Know Your Dog form. Each gets its definition from kydData and its value from the form state.
import { View } from 'react-native';
import { AppText, CheckboxField, Chip, DateField, TextInput } from '@/components/common';
import { makeStyles } from '@/theme';
import { toDateKey } from '@/utils/date';
import type { ChoiceFieldDef, ConfirmFieldDef, DateFieldDef, TextFieldDef } from './kydData';

/** Question text, optional required star and grey hint line. */
export function FieldLabel({ label, hint, required }: { label: string; hint?: string; required?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.label}>
      <AppText variant="body">
        {label}
        {required && <AppText variant="bodyStrong" color="primaryText">{' *'}</AppText>}
      </AppText>
      {!!hint && <AppText variant="caption">{hint}</AppText>}
    </View>
  );
}

export function KydTextField({ field, value, error, onChange }: { field: TextFieldDef; value: string; error?: string; onChange: (v: string) => void }) {
  return (
    <View>
      <FieldLabel label={field.label} hint={field.hint} required={!!field.required} />
      <TextInput
        value={value}
        onChangeText={onChange}
        error={error}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        multiline={field.multiline}
        numberOfLines={field.multiline ? 3 : undefined}
        keyboardType={field.phone ? 'phone-pad' : 'default'}
        autoComplete={field.autoComplete}
        autoCapitalize={field.phone ? 'none' : 'sentences'}
        accessibilityLabel={field.label}
      />
    </View>
  );
}

/** Pill choices (Yes / No, Male / Female). Tapping the selected one again clears an optional answer. */
export function KydChoiceField({ field, value, error, onChange }: { field: ChoiceFieldDef; value: string; error?: string; onChange: (v: string) => void }) {
  const styles = useStyles();
  return (
    <View>
      <FieldLabel label={field.label} hint={field.hint} required={!!field.required} />
      <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel={field.label}>
        {field.options.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={value === o.value}
            onPress={() => onChange(value === o.value && !field.required ? '' : o.value)}
            accessibilityLabel={`${field.label}: ${o.label}`}
          />
        ))}
      </View>
      {!!error && <AppText variant="label" color="danger" style={styles.error}>{error}</AppText>}
    </View>
  );
}

export function KydDateField({ field, value, error, onChange }: { field: DateFieldDef; value: string; error?: string; onChange: (v: string) => void }) {
  return (
    <DateField
      label={field.label}
      value={value || null}
      onChange={onChange}
      maxDate={toDateKey(new Date())}
      helperText={field.hint}
      error={error}
    />
  );
}

export function KydConfirmField({ field, value, error, onChange }: { field: ConfirmFieldDef; value: boolean; error?: string; onChange: (v: boolean) => void }) {
  return <CheckboxField label={field.label} value={value} onChange={onChange} error={error} />;
}

const useStyles = makeStyles((t) => ({
  label: { gap: t.spacing.xxs, marginBottom: t.spacing.sm },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  error: { marginTop: t.spacing.xs },
}));
