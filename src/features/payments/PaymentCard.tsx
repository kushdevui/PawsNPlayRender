// Payment summary + history for one booking, with "Record payment".
import { useState } from 'react';
import { Alert, View } from 'react-native';
import type { Booking, Payment } from '@/api/types';
import { AppText, Badge, Button, Card, Divider, Icon, InlineAlert, ProgressBar } from '@/components/common';
import { makeStyles } from '@/theme';
import { formatDateTime } from '@/utils/date';
import { formatPrice } from '@/utils/format';
import { useRemovePayment } from './hooks';
import { paymentBadgeLabel, paymentMethodIcon, paymentMethodLabel, paymentStatusTone, paymentTypeLabel } from './labels';
import { RecordPaymentSheet } from './RecordPaymentSheet';

export function PaymentCard({ booking }: { booking: Booking }) {
  const styles = useStyles();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remove = useRemovePayment(booking.id);
  const c = booking.currency;
  const cancelled = booking.status === 'cancelled';
  const canRecord = cancelled ? booking.amountPaid > 0 : booking.balanceDue !== 0;

  const confirmRemove = (p: Payment) =>
    Alert.alert('Remove payment?', `${paymentTypeLabel[p.type]} of ${formatPrice(p.amount, c)} will be removed. Use this only to fix a mistake.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setError(null);
          remove.mutate(p.id, { onError: (e) => setError(e.message) });
        },
      },
    ]);

  const payments = [...booking.payments].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

  return (
    <Card>
      <View style={styles.between}>
        <AppText variant="label" color="textMuted">PAYMENT</AppText>
        <Badge label={paymentBadgeLabel(booking)} tone={cancelled ? 'neutral' : paymentStatusTone[booking.paymentStatus]} />
      </View>

      <View style={styles.totals}>
        <Total label={cancelled ? 'Total (cancelled)' : 'Total'} value={formatPrice(cancelled ? 0 : booking.totalAmount, c)} />
        <Total label="Received" value={formatPrice(booking.amountPaid, c)} />
        <Total
          label={booking.balanceDue < 0 ? 'To refund' : 'Due'}
          value={formatPrice(Math.abs(booking.balanceDue), c)}
          strong={booking.balanceDue !== 0}
        />
      </View>
      {!cancelled && booking.totalAmount > 0 && <ProgressBar value={booking.amountPaid / booking.totalAmount} tone="brand" />}

      {!!error && <InlineAlert message={error} />}

      {payments.length > 0 && (
        <View style={styles.list}>
          <Divider />
          {payments.map((p) => (
            <View key={p.id} style={styles.payment}>
              <Icon name={paymentMethodIcon[p.method]} color="textMuted" />
              <View style={styles.paymentText}>
                <AppText variant="bodyStrong">
                  {p.type === 'refund' ? '− ' : ''}
                  {formatPrice(p.amount, c)} <AppText variant="caption">{paymentTypeLabel[p.type]} · {paymentMethodLabel[p.method]}</AppText>
                </AppText>
                <AppText variant="caption">{formatDateTime(p.receivedAt)}{p.note ? ` · ${p.note}` : ''}</AppText>
              </View>
              <Button title="Remove" variant="ghost" size="sm" onPress={() => confirmRemove(p)} />
            </View>
          ))}
        </View>
      )}

      {canRecord && (
        <Button
          title={cancelled || booking.balanceDue < 0 ? 'Record refund' : booking.amountPaid === 0 ? 'Record advance' : 'Record payment'}
          icon="cash-plus"
          variant="secondary"
          fullWidth
          onPress={() => setRecording(true)}
          style={styles.action}
        />
      )}

      <RecordPaymentSheet booking={booking} visible={recording} onDismiss={() => setRecording(false)} />
    </Card>
  );
}

function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.total}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant={strong ? 'subheading' : 'bodyStrong'}>{value}</AppText>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totals: { flexDirection: 'row', marginVertical: t.spacing.sm },
  total: { flex: 1, gap: t.spacing.xxs },
  list: { gap: t.spacing.sm, marginTop: t.spacing.sm },
  payment: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  paymentText: { flex: 1, gap: t.spacing.xxs },
  action: { marginTop: t.spacing.md },
}));
