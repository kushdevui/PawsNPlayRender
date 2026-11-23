// Quick "Edit capacity" sheet used from the dashboard capacity card.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, InlineAlert, NumberStepper, Sheet } from '@/components/common';
import { useUpdateSettings } from '@/features/dashboard/hooks';
import { makeStyles } from '@/theme';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  capacity: number;
  /** Dogs checked in right now - capacity cannot go below this. */
  occupiedNow: number;
}

export function CapacitySheet({ visible, onDismiss, capacity, occupiedNow }: Props) {
  const styles = useStyles();
  const update = useUpdateSettings();
  const [value, setValue] = useState(capacity);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValue(capacity);
      setError(null);
    }
  }, [visible, capacity]);

  const save = () => {
    setError(null);
    update.mutate({ capacity: value }, { onSuccess: onDismiss, onError: (e) => setError(e.message) });
  };

  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      title="Boarding capacity"
      footer={
        <View style={styles.footer}>
          <Button title="Cancel" variant="ghost" onPress={onDismiss} />
          <Button title="Save" onPress={save} loading={update.isPending} disabled={value === capacity} />
        </View>
      }
    >
      <View style={styles.body}>
        {!!error && <InlineAlert message={error} />}
        <NumberStepper
          label="Total dogs we can board at once"
          value={value}
          onChange={setValue}
          min={Math.max(1, occupiedNow)}
          max={500}
          unit="dogs"
          helperText={`${occupiedNow} dogs are checked in now, so capacity can't go below ${Math.max(1, occupiedNow)}. New bookings are blocked on days that would go over capacity.`}
        />
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.md, paddingBottom: t.spacing.sm },
  footer: { flexDirection: 'row', gap: t.spacing.sm },
}));
