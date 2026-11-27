// Billing for a period (this/next/last week, a month, or custom dates): expected / received / due for
// stays checking in, cash collected in the period, outstanding overall, and who still owes.
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import type { Booking } from '@/api/types';
import { AppText, Card, Chip, DateField, MonthSwitcher, ProgressBar, Screen, StateView } from '@/components/common';
import { BookingCard } from '@/features/bookings/BookingCard';
import { useBookings } from '@/features/bookings/hooks';
import { useBilling } from '@/features/payments/hooks';
import { makeStyles } from '@/theme';
import { addDays, dateKeysRange, formatRange, monthRange, startOfMonth, startOfWeek, toDateKey, weekRange } from '@/utils/date';
import { formatPrice, plural } from '@/utils/format';

type Filter = 'all' | 'due' | 'paid';
type Period = 'thisWeek' | 'nextWeek' | 'lastWeek' | 'month' | 'custom';

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: 'thisWeek', label: 'This week' },
  { value: 'nextWeek', label: 'Next week' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'month', label: 'Month' },
  { value: 'custom', label: 'Custom' },
];

export default function Billing() {
  const styles = useStyles();
  const [period, setPeriod] = useState<Period>('month');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [customFrom, setCustomFrom] = useState(() => toDateKey(startOfWeek(new Date())));
  const [customTo, setCustomTo] = useState(() => toDateKey(addDays(startOfWeek(new Date()), 6)));
  const [filter, setFilter] = useState<Filter>('due');

  const range =
    period === 'thisWeek' ? weekRange(0)
    : period === 'nextWeek' ? weekRange(1)
    : period === 'lastWeek' ? weekRange(-1)
    : period === 'custom' ? dateKeysRange(customFrom, customTo)
    : monthRange(month);
  const rangeLabel = formatRange(range.from, range.to);
  const billing = useBilling(range.from, range.to);
  // Stays overlapping the month; billing counts stays by CHECK-IN month, so filter to those.
  const bookings = useBookings(range);

  const rows = useMemo(() => {
    const from = new Date(range.from).getTime();
    const to = new Date(range.to).getTime();
    const inMonth = (b: Booking) => b.status !== 'cancelled' && new Date(b.checkIn).getTime() >= from && new Date(b.checkIn).getTime() < to;
    const list = (bookings.data?.data ?? []).filter(inMonth);
    const filtered =
      filter === 'due' ? list.filter((b) => b.balanceDue > 0) : filter === 'paid' ? list.filter((b) => b.balanceDue <= 0) : list;
    return filtered.sort((a, b) => (filter === 'due' ? b.balanceDue - a.balanceDue : a.checkIn.localeCompare(b.checkIn)));
  }, [bookings.data, filter, range.from, range.to]);

  const s = billing.data;
  const c = s?.currency ?? 'INR';

  const header = (
    <View style={styles.header}>
      <AppText variant="heading">Billing</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {PERIODS.map((p) => (
          <Chip key={p.value} label={p.label} selected={period === p.value} onPress={() => setPeriod(p.value)} />
        ))}
      </ScrollView>
      {period === 'month' && <MonthSwitcher month={month} onChange={setMonth} />}
      {period === 'custom' && (
        <View style={styles.row}>
          <View style={styles.cell}>
            <DateField
              label="From"
              value={customFrom}
              onChange={(v) => {
                setCustomFrom(v);
                if (customTo < v) setCustomTo(v);
              }}
            />
          </View>
          <View style={styles.cell}>
            <DateField label="To" value={customTo} onChange={setCustomTo} minDate={customFrom} rangeStart={customFrom} />
          </View>
        </View>
      )}
      {period !== 'month' && <AppText variant="subheading">{rangeLabel}</AppText>}

      {billing.isLoading || billing.error || !s ? (
        <View style={styles.loading}>
          <StateView loading={billing.isLoading} error={billing.error} onRetry={billing.refetch} />
        </View>
      ) : (
        <>
          <Card>
            <AppText variant="label" color="textMuted">STAYS CHECKING IN · {s.bookings}</AppText>
            <View style={styles.totals}>
              <Total label="Expected" value={formatPrice(s.expected, c)} />
              <Total label="Received" value={formatPrice(s.received, c)} />
              <Total label="Due" value={formatPrice(s.due, c)} strong />
            </View>
            <ProgressBar value={s.expected ? s.received / s.expected : 0} tone="brand" />
            <AppText variant="caption">
              {s.expected ? Math.round((s.received / s.expected) * 100) : 0}% collected · advances {formatPrice(s.advances, c)} ·{' '}
              {s.paidCount} paid · {s.partialCount} part-paid · {s.unpaidCount} unpaid
            </AppText>
          </Card>

          <Card>
            <View style={styles.between}>
              <View style={styles.flex}>
                <AppText variant="label" color="textMuted">COLLECTED IN THIS PERIOD</AppText>
                <AppText variant="caption">{plural(s.collectedCount, 'payment')} received {rangeLabel} (any stay, refunds deducted)</AppText>
              </View>
              <AppText variant="subheading">{formatPrice(s.collected, c)}</AppText>
            </View>
          </Card>

          <Card>
            <View style={styles.between}>
              <View style={styles.flex}>
                <AppText variant="label" color="textMuted">TOTAL OUTSTANDING (ALL MONTHS)</AppText>
                <AppText variant="caption">{plural(s.outstandingBookings, 'booking')} with money due</AppText>
              </View>
              <AppText variant="subheading">{formatPrice(s.outstandingAllTime, c)}</AppText>
            </View>
          </Card>
        </>
      )}

      <View style={styles.chips}>
        <Chip label="Due" selected={filter === 'due'} onPress={() => setFilter('due')} />
        <Chip label="Paid" selected={filter === 'paid'} onPress={() => setFilter('paid')} />
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
      </View>
    </View>
  );

  return (
    <Screen style={styles.screen}>
      {bookings.isLoading || bookings.error || rows.length === 0 ? (
        <>
          {header}
          <StateView
            loading={bookings.isLoading}
            error={bookings.error}
            empty={!rows.length}
            emptyText={filter === 'due' ? 'Nothing due for stays in this period.' : 'No stays check in during this period.'}
            onRetry={bookings.refetch}
          />
        </>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(b) => b.id}
          onRefresh={() => {
            billing.refetch();
            bookings.refetch();
          }}
          refreshing={bookings.isRefetching}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <BookingCard booking={item} onPress={() => router.push({ pathname: '/admin/booking/[id]', params: { id: item.id } })} />
            </View>
          )}
        />
      )}
    </Screen>
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
  screen: { paddingHorizontal: 0, paddingBottom: 0 },
  header: { paddingHorizontal: t.spacing.xl, gap: t.spacing.md, paddingBottom: t.spacing.sm },
  loading: { height: 160 },
  totals: { flexDirection: 'row', marginVertical: t.spacing.sm },
  total: { flex: 1, gap: t.spacing.xxs },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: t.spacing.md },
  chips: { flexDirection: 'row', gap: t.spacing.sm },
  row: { flexDirection: 'row', gap: t.spacing.md },
  cell: { flex: 1 },
  flex: { flex: 1 },
  list: { gap: t.spacing.md, paddingBottom: t.spacing.xxxl },
  item: { paddingHorizontal: t.spacing.xl },
}));
