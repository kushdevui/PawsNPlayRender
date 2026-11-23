import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import { WEEKDAY_INITIALS, addMonths, formatMonth, fromDateKey, startOfMonth, toDateKey } from '@/utils/date';
import { AppText } from './AppText';

interface Props {
  /** Selected date 'YYYY-MM-DD' */
  value?: string | null;
  onChange: (dateKey: string) => void;
  /** Dates before this ('YYYY-MM-DD') are disabled. */
  minDate?: string;
  /** Optional highlighted range end, e.g. check-in while picking check-out. */
  rangeStart?: string | null;
}

/** Month calendar grid (no native dependency - works in Expo Go). */
export function Calendar({ value, onChange, minDate, rangeStart }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const [month, setMonth] = useState(() => startOfMonth(value ? fromDateKey(value) : new Date()));
  const todayKey = toDateKey(new Date());

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const blanks = Array.from({ length: first.getDay() }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => toDateKey(new Date(first.getFullYear(), first.getMonth(), i + 1)));
    return [...blanks, ...days];
  }, [month]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" onPress={() => setMonth((m) => addMonths(m, -1))} accessibilityLabel="Previous month" />
        <AppText variant="bodyStrong">{formatMonth(month)}</AppText>
        <IconButton icon="chevron-right" onPress={() => setMonth((m) => addMonths(m, 1))} accessibilityLabel="Next month" />
      </View>
      <View style={styles.row}>
        {WEEKDAY_INITIALS.map((d, i) => (
          <View key={i} style={styles.cell}>
            <AppText variant="caption" color="textSubtle">{d}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((key, i) => {
          if (!key) return <View key={`b${i}`} style={styles.cell} />;
          const disabled = !!minDate && key < minDate;
          const selected = key === value;
          const inRange = !!rangeStart && !!value && key > rangeStart && key < value;
          const isRangeStart = key === rangeStart;
          return (
            <View key={key} style={styles.cell}>
              <Pressable
                onPress={() => onChange(key)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                accessibilityLabel={key}
                style={[
                  styles.day,
                  (inRange || isRangeStart) && { backgroundColor: theme.colors.primarySoft },
                  selected && { backgroundColor: theme.colors.secondary },
                  key === todayKey && !selected && styles.today,
                ]}
              >
                <AppText
                  variant="body"
                  style={[
                    selected && { color: theme.colors.onSecondary, fontWeight: theme.fontWeight.bold },
                    disabled && { color: theme.colors.onDisabled },
                  ]}
                >
                  {Number(key.slice(8))}
                </AppText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  day: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderRadius: t.radius.pill },
  today: { borderWidth: t.sizes.borderWidth, borderColor: t.colors.primary },
}));
