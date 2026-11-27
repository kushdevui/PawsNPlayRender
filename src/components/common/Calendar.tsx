import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import { WEEKDAY_SHORT, addMonths, formatMonth, fromDateKey, startOfMonth, toDateKey, toWeeks } from '@/utils/date';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface Props {
  /** Selected date 'YYYY-MM-DD' */
  value?: string | null;
  onChange: (dateKey: string) => void;
  /** Dates before this ('YYYY-MM-DD') are disabled. */
  minDate?: string;
  /** Dates after this ('YYYY-MM-DD') are disabled (e.g. today for date of birth). */
  maxDate?: string;
  /** Optional highlighted range end, e.g. check-in while picking check-out. */
  rangeStart?: string | null;
  /** Start on the year grid - for dates far from today (date of birth). */
  startWithYear?: boolean;
}

type Mode = 'days' | 'months' | 'years';
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS_PER_PAGE = 12;

/**
 * Month calendar with quick year/month jumping (no native dependency - works in Expo Go).
 * Tap the "November 2026" title to pick a year, then a month.
 */
export function Calendar({ value, onChange, minDate, maxDate, rangeStart, startWithYear = false }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const todayKey = toDateKey(new Date());
  const initial = value ? fromDateKey(value) : maxDate && maxDate < todayKey ? fromDateKey(maxDate) : new Date();
  const minYear = minDate ? Number(minDate.slice(0, 4)) : 1900;
  const maxYear = maxDate ? Number(maxDate.slice(0, 4)) : 2100;
  /** First year of the 12-year page that shows `year` near the end (recent years first). */
  const pageStartFor = (year: number) => Math.min(year, maxYear - YEARS_PER_PAGE + 1) - 0;

  const [month, setMonth] = useState(() => startOfMonth(initial));
  const [mode, setMode] = useState<Mode>(startWithYear && !value ? 'years' : 'days');
  const [yearPageStart, setYearPageStart] = useState(() => pageStartFor(initial.getFullYear() - YEARS_PER_PAGE + 1));

  const monthKey = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;
  const monthDisabled = (y: number, m: number) =>
    (!!minDate && monthKey(y, m) < minDate.slice(0, 7)) || (!!maxDate && monthKey(y, m) > maxDate.slice(0, 7));

  const weeks = useMemo(() => {
    const first = startOfMonth(month);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const blanks = Array.from({ length: first.getDay() }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => toDateKey(new Date(first.getFullYear(), first.getMonth(), i + 1)));
    return toWeeks<string>([...blanks, ...days]);
  }, [month]);

  const prevMonth = addMonths(month, -1);
  const nextMonth = addMonths(month, 1);
  const canPrev =
    mode === 'days' ? !monthDisabled(prevMonth.getFullYear(), prevMonth.getMonth())
    : mode === 'months' ? month.getFullYear() > minYear
    : yearPageStart > minYear;
  const canNext =
    mode === 'days' ? !monthDisabled(nextMonth.getFullYear(), nextMonth.getMonth())
    : mode === 'months' ? month.getFullYear() < maxYear
    : yearPageStart + YEARS_PER_PAGE <= maxYear;

  const prev = () => {
    if (mode === 'days') setMonth(prevMonth);
    else if (mode === 'months') setMonth(new Date(month.getFullYear() - 1, month.getMonth(), 1));
    else setYearPageStart((y) => y - YEARS_PER_PAGE);
  };
  const next = () => {
    if (mode === 'days') setMonth(nextMonth);
    else if (mode === 'months') setMonth(new Date(month.getFullYear() + 1, month.getMonth(), 1));
    else setYearPageStart((y) => y + YEARS_PER_PAGE);
  };

  const openYears = () => {
    // Show a page that contains the current year, with it near the end.
    setYearPageStart(pageStartFor(month.getFullYear() - YEARS_PER_PAGE + 1 + Math.min(YEARS_PER_PAGE - 1, Math.max(0, maxYear - month.getFullYear()))));
    setMode('years');
  };

  const title =
    mode === 'days' ? formatMonth(month)
    : mode === 'months' ? String(month.getFullYear())
    : `${yearPageStart} – ${yearPageStart + YEARS_PER_PAGE - 1}`;

  const pickStyle = (selected: boolean, disabled: boolean) => [
    selected && { color: theme.colors.onSecondary, fontWeight: theme.fontWeight.bold },
    disabled && { color: theme.colors.onDisabled },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <IconButton icon="chevron-left" disabled={!canPrev} onPress={prev} accessibilityLabel="Previous" />
        <Pressable
          onPress={() => (mode === 'days' ? openYears() : setMode(mode === 'years' ? 'days' : 'years'))}
          accessibilityRole="button"
          accessibilityLabel={mode === 'days' ? `${title}, change month or year` : title}
          style={styles.titleBtn}
        >
          <AppText variant="bodyStrong">{title}</AppText>
          <Icon name={mode === 'days' ? 'menu-down' : 'menu-up'} size={20} />
        </Pressable>
        <IconButton icon="chevron-right" disabled={!canNext} onPress={next} accessibilityLabel="Next" />
      </View>

      {mode === 'years' && (
        <View style={styles.pickGrid}>
          {Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i).map((y) => {
            const disabled = y < minYear || y > maxYear;
            const selected = y === month.getFullYear();
            return (
              <Pressable
                key={y}
                disabled={disabled}
                onPress={() => {
                  setMonth(new Date(y, month.getMonth(), 1));
                  setMode('months');
                }}
                style={[styles.pickCell, selected && { backgroundColor: theme.colors.secondary }]}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
              >
                <AppText style={pickStyle(selected, disabled)}>{y}</AppText>
              </Pressable>
            );
          })}
        </View>
      )}

      {mode === 'months' && (
        <View style={styles.pickGrid}>
          {MONTHS_SHORT.map((label, m) => {
            const y = month.getFullYear();
            const disabled = monthDisabled(y, m);
            const selected = !!value && value.slice(0, 7) === monthKey(y, m);
            return (
              <Pressable
                key={label}
                disabled={disabled}
                onPress={() => {
                  setMonth(new Date(y, m, 1));
                  setMode('days');
                }}
                style={[styles.pickCell, selected && { backgroundColor: theme.colors.secondary }]}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
              >
                <AppText style={pickStyle(selected, disabled)}>{label}</AppText>
              </Pressable>
            );
          })}
        </View>
      )}

      {mode === 'days' && (
        <>
          <View style={styles.row}>
            {WEEKDAY_SHORT.map((d, i) => (
              <View key={i} style={styles.headCell}>
                <AppText variant="caption" color="textSubtle">{d}</AppText>
              </View>
            ))}
          </View>
          <View>
            {weeks.map((week, w) => (
              <View key={w} style={styles.row}>
                {week.map((key, i) => {
                  if (!key) return <View key={`b${w}-${i}`} style={styles.cell} />;
                  const disabled = (!!minDate && key < minDate) || (!!maxDate && key > maxDate);
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
                        <AppText variant="body" style={pickStyle(selected, disabled)}>{Number(key.slice(8))}</AppText>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xxs,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.pill,
  },
  row: { flexDirection: 'row' },
  headCell: { flex: 1, alignItems: 'center', paddingVertical: t.spacing.xs },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  day: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderRadius: t.radius.pill },
  today: { borderWidth: t.sizes.borderWidth, borderColor: t.colors.primary },
  pickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: t.spacing.sm },
  pickCell: { width: '33.33%', paddingVertical: t.spacing.md, alignItems: 'center', borderRadius: t.radius.pill },
}));
