import { View } from 'react-native';
import { AppText } from '@/components/common';
import { makeStyles, useTheme } from '@/theme';
import { WEEKDAY_INITIALS, fromDateKey, isToday } from '@/utils/date';

/** Simple 7-day bar chart of dogs booked per day vs capacity. */
export function OccupancyChart({ days, capacity }: { days: Array<{ date: string; count: number }>; capacity: number }) {
  const theme = useTheme();
  const styles = useStyles();
  const max = Math.max(capacity, ...days.map((d) => d.count), 1);
  return (
    <View style={styles.wrap} accessibilityLabel={`Next 7 days occupancy: ${days.map((d) => d.count).join(', ')} of ${capacity}`}>
      {days.map((d) => {
        const date = fromDateKey(d.date);
        const ratio = d.count / capacity;
        const color = ratio >= 1 ? theme.colors.danger : ratio >= 0.8 ? theme.colors.warning : theme.colors.primary;
        return (
          <View key={d.date} style={styles.col}>
            <AppText variant="caption" color="text" style={styles.count}>{d.count}</AppText>
            <View style={styles.track}>
              <View style={[styles.bar, { height: `${Math.max(4, (d.count / max) * 100)}%`, backgroundColor: color }]} />
            </View>
            <AppText variant="caption" color={isToday(date) ? 'text' : 'textSubtle'} style={isToday(date) ? styles.today : undefined}>
              {WEEKDAY_INITIALS[date.getDay()]}
            </AppText>
            <AppText variant="caption" color="textSubtle" style={styles.date}>{date.getDate()}</AppText>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.sm, height: 150 },
  col: { flex: 1, alignItems: 'center', gap: t.spacing.xxs },
  count: { fontWeight: t.fontWeight.semibold },
  track: { flex: 1, width: '70%', justifyContent: 'flex-end', backgroundColor: t.colors.surfaceMuted, borderRadius: t.radius.sm, overflow: 'hidden' },
  bar: { width: '100%', borderRadius: t.radius.sm },
  today: { fontWeight: t.fontWeight.bold },
  date: { fontSize: t.fontSize.xs },
}));
