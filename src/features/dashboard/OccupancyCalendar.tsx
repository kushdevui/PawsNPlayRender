// Month calendar of boarding occupancy: each day shows booked/capacity, coloured by how full it is.
// Tap a day to see who is arriving, staying and leaving, and to book that date.
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { OccupancyDay } from '@/api/types';
import { AppText, Card, MonthSwitcher, StateView } from '@/components/common';
import { makeStyles, useTheme, type AppTheme } from '@/theme';
import { WEEKDAY_INITIALS, addMonths, startOfMonth, toDateKey } from '@/utils/date';
import { DaySheet } from './DaySheet';
import { useOccupancy } from './hooks';

type Level = 'free' | 'busy' | 'full' | 'empty';

const levelOf = (day: OccupancyDay, capacity: number): Level => {
  if (day.occupied === 0) return 'empty';
  const r = day.occupied / capacity;
  return r >= 1 ? 'full' : r >= 0.8 ? 'busy' : 'free';
};

const levelColors = (t: AppTheme, level: Level) =>
  ({
    empty: { bg: t.colors.surface, fg: t.colors.textSubtle },
    free: { bg: t.colors.primarySoft, fg: t.colors.text },
    busy: { bg: t.colors.warningSoft, fg: t.colors.warning },
    full: { bg: t.colors.dangerSoft, fg: t.colors.danger },
  })[level];

export function OccupancyCalendar() {
  const theme = useTheme();
  const styles = useStyles();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [openDay, setOpenDay] = useState<OccupancyDay | null>(null);

  const from = toDateKey(month);
  const to = toDateKey(addMonths(month, 1));
  const { data, isLoading, error, refetch } = useOccupancy(from, to);
  const todayKey = toDateKey(new Date());

  const cells = useMemo(() => {
    const blanks = Array.from({ length: month.getDay() }, () => null);
    return [...blanks, ...(data?.days ?? [])];
  }, [data, month]);

  const capacity = data?.capacity ?? 0;
  const monthPeak = Math.max(0, ...(data?.days ?? []).map((d) => d.occupied));
  const fullDays = (data?.days ?? []).filter((d) => d.date >= todayKey && d.occupied >= capacity).length;

  return (
    <Card>
      <MonthSwitcher month={month} onChange={setMonth} />
      {isLoading || error || !data ? (
        <View style={styles.loading}>
          <StateView loading={isLoading} error={error} onRetry={refetch} />
        </View>
      ) : (
        <>
          <View style={styles.row}>
            {WEEKDAY_INITIALS.map((d, i) => (
              <View key={i} style={styles.headCell}>
                <AppText variant="caption" color="textSubtle">{d}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`b${i}`} style={styles.cell} />;
              const level = levelOf(day, capacity);
              const c = levelColors(theme, level);
              const isToday = day.date === todayKey;
              const isPast = day.date < todayKey;
              return (
                <View key={day.date} style={styles.cell}>
                  <Pressable
                    onPress={() => setOpenDay(day)}
                    accessibilityRole="button"
                    accessibilityLabel={`${day.date}: ${day.occupied} of ${capacity} booked, ${day.available} free, ${day.checkIns} arriving`}
                    style={({ pressed }) => [
                      styles.day,
                      { backgroundColor: c.bg, opacity: isPast ? 0.55 : 1 },
                      isToday && styles.today,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText variant="caption" color="text" style={[styles.dayNum, isToday && styles.bold]}>
                      {Number(day.date.slice(8))}
                    </AppText>
                    <AppText style={[styles.count, { color: c.fg }]}>
                      {day.occupied > 0 ? `${day.occupied}/${capacity}` : '–'}
                    </AppText>
                    {day.checkIns > 0 && <View style={styles.dot} />}
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={styles.legend}>
            <Legend color={theme.colors.primarySoft} label="Space" />
            <Legend color={theme.colors.warningSoft} label="80%+" />
            <Legend color={theme.colors.dangerSoft} label="Full" />
            <View style={styles.legendItem}>
              <View style={styles.dotStatic} />
              <AppText variant="caption">Arrivals</AppText>
            </View>
          </View>
          <AppText variant="caption" align="center">
            Busiest day this month: {monthPeak}/{capacity}
            {fullDays > 0 ? ` · ${fullDays} upcoming full day${fullDays === 1 ? '' : 's'}` : ''} · Tap a day for details
          </AppText>
        </>
      )}

      {openDay && <DaySheet day={openDay} capacity={capacity} onDismiss={() => setOpenDay(null)} />}
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  loading: { height: 280 },
  row: { flexDirection: 'row' },
  headCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: t.spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 0.85, padding: 2 },
  day: {
    flex: 1,
    borderRadius: t.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: t.sizes.borderWidth,
    borderColor: t.colors.border,
  },
  today: { borderColor: t.colors.secondary, borderWidth: 2 },
  pressed: { opacity: 0.7 },
  dayNum: { fontSize: t.fontSize.xs, lineHeight: 14 },
  bold: { fontWeight: t.fontWeight.bold },
  count: { fontSize: 11, fontWeight: t.fontWeight.bold, lineHeight: 14 },
  dot: { position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.secondary },
  dotStatic: { width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.secondary },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: t.spacing.md, marginTop: t.spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs },
  swatch: { width: 12, height: 12, borderRadius: 3, borderWidth: t.sizes.borderWidth, borderColor: t.colors.border },
}));
