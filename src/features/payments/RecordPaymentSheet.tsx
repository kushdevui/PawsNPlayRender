// Record an advance, payment or refund against a booking.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Booking, PaymentMethod, PaymentType } from '@/api/types';
import { AppText, Button, Chip, DateField, InlineAlert, SegmentedControl, Sheet, TextInput } from '@/components/common';
import { makeStyles } from '@/theme';
import { combineDateTime, toDateKey, toTimeKey } from '@/utils/date';
import { formatPrice } from '@/utils/format';
import { useAddPayment } from './hooks';
import { paymentMethodOptions } from './labels';

interface Props {
  booking: Booking;
  visible: boolean;
  onDismiss: () => void;
}

export function RecordPaymentSheet({ booking, visible, onDismiss }: Props) {
  const styles = useStyles();
  const add = useAddPayment(booking.id);
  const isCancelled = booking.status === 'cancelled';
  const due = Math.max(0, booking.balanceDue);
  const refundable = Math.max(0, booking.amountPaid);

  const [type, setType] = useState<PaymentType>('advance');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toDateKey(new Date()));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const t: PaymentType = isCancelled || booking.balanceDue < 0 ? 'refund' : booking.amountPaid === 0 ? 'advance' : 'payment';
    setType(t);
    setAmount(t === 'refund' ? String(refundable) : t === 'payment' ? String(due) : '');
    setMethod('upi');
    setDate(toDateKey(new Date()));
    setNote('');
    setError(null);
  }, [visible, booking, isCancelled, due, refundable]);

  const typeOptions: Array<{ value: PaymentType; label: string }> = isCancelled
    ? [{ value: 'refund', label: 'Refund' }]
    : [
        { value: 'advance', label: 'Advance' },
        { value: 'payment', label: 'Payment' },
        { value: 'refund', label: 'Refund' },
      ];

  const quick =
    type === 'refund'
      ? [{ label: `All ${formatPrice(refundable)}`, value: refundable }]
      : [
          ...(booking.amountPaid === 0 ? [{ label: `50% · ${formatPrice(Math.round(booking.totalAmount / 2))}`, value: Math.round(booking.totalAmount / 2) }] : []),
          { label: `Full balance · ${formatPrice(due)}`, value: due },
        ];

  const save = () => {
    const value = Number(amount);
    if (!(value > 0)) return setError('Enter an amount above 0.');
    if (type !== 'refund' && value > due) return setError(`Only ${formatPrice(due)} is due on this booking.`);
    if (type === 'refund' && value > refundable) return setError(`You can refund up to ${formatPrice(refundable)}.`);
    setError(null);
    const isToday = date === toDateKey(new Date());
    add.mutate(
      {
        amount: value,
        type,
        method,
        note: note.trim(),
        receivedAt: isToday ? new Date().toISOString() : combineDateTime(date, toTimeKey(new Date())),
      },
      { onSuccess: onDismiss, onError: (e) => setError(e.message) },
    );
  };

  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      title={type === 'refund' ? 'Record refund' : 'Record payment'}
      footer={
        <View style={styles.footer}>
          <Button title="Cancel" variant="ghost" onPress={onDismiss} />
          <Button title="Save" onPress={save} loading={add.isPending} />
        </View>
      }
    >
      <View style={styles.body}>
        <AppText variant="caption">
          Total {formatPrice(booking.totalAmount, booking.currency)} · received {formatPrice(booking.amountPaid, booking.currency)} ·{' '}
          {booking.balanceDue >= 0 ? `due ${formatPrice(booking.balanceDue, booking.currency)}` : `overpaid ${formatPrice(-booking.balanceDue, booking.currency)}`}
        </AppText>
        {!!error && <InlineAlert message={error} />}

        <SegmentedControl
          value={type}
          onChange={(t) => {
            setType(t);
            setAmount(t === 'refund' ? String(refundable) : t === 'payment' ? String(due) : '');
          }}
          options={typeOptions}
        />

        <TextInput
          label="Amount (₹)"
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          leftIcon="currency-inr"
        />
        <View style={styles.chips}>
          {quick.filter((q) => q.value > 0).map((q) => (
            <Chip key={q.label} label={q.label} selected={Number(amount) === q.value} onPress={() => setAmount(String(q.value))} />
          ))}
        </View>

        <AppText variant="label">Method</AppText>
        <View style={styles.chips}>
          {paymentMethodOptions.map((m) => (
            <Chip key={m.value} label={m.label} selected={method === m.value} onPress={() => setMethod(m.value)} />
          ))}
        </View>

        <DateField label="Received on" value={date} onChange={setDate} />
        <TextInput label="Note (optional)" value={note} onChangeText={setNote} placeholder="UPI ref, who paid…" />
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.spacing.md, paddingBottom: t.spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
  footer: { flexDirection: 'row', gap: t.spacing.sm },
}));
