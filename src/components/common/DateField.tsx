import { useState } from 'react';
import { formatDateLong, fromDateKey } from '@/utils/date';
import { Calendar } from './Calendar';
import { PickerField } from './PickerField';
import { Sheet } from './Sheet';

interface Props {
  label: string;
  /** 'YYYY-MM-DD' or null */
  value: string | null;
  onChange: (dateKey: string) => void;
  minDate?: string;
  /** Highlights the range from this date to the selection (e.g. check-in). */
  rangeStart?: string | null;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
}

/** Date input: tap -> calendar sheet. Value is a local 'YYYY-MM-DD'. */
export function DateField({ label, value, onChange, minDate, rangeStart, error, helperText, placeholder = 'Select date', disabled }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PickerField
        label={label}
        displayValue={value ? formatDateLong(fromDateKey(value)) : ''}
        placeholder={placeholder}
        icon="calendar-blank-outline"
        onPress={() => setOpen(true)}
        error={error}
        helperText={helperText}
        disabled={disabled}
      />
      <Sheet visible={open} onDismiss={() => setOpen(false)} title={label}>
        <Calendar
          value={value}
          minDate={minDate}
          rangeStart={rangeStart}
          onChange={(key) => {
            onChange(key);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}
