import { useState } from 'react';
import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { TIME_SLOTS, formatTime } from '@/utils/date';
import { Chip } from './Chip';
import { PickerField } from './PickerField';
import { Sheet } from './Sheet';

interface Props {
  label: string;
  /** 'HH:mm' or null */
  value: string | null;
  onChange: (timeKey: string) => void;
  /** Available times, default every 30 min 06:00-22:00. */
  slots?: string[];
  error?: string;
  disabled?: boolean;
}

/** Time input: tap -> grid of time slots. Value is 'HH:mm'. */
export function TimeField({ label, value, onChange, slots = TIME_SLOTS, error, disabled }: Props) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const options = value && !slots.includes(value) ? [...slots, value].sort() : slots;
  return (
    <>
      <PickerField
        label={label}
        displayValue={value ? formatTime(value) : ''}
        placeholder="Select time"
        icon="clock-outline"
        onPress={() => setOpen(true)}
        error={error}
        disabled={disabled}
      />
      <Sheet visible={open} onDismiss={() => setOpen(false)} title={label}>
        <View style={styles.grid}>
          {options.map((slot) => (
            <Chip
              key={slot}
              label={formatTime(slot)}
              selected={slot === value}
              onPress={() => {
                onChange(slot);
                setOpen(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm, paddingBottom: t.spacing.md },
}));
