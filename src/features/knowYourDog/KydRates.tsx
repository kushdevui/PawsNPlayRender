// "With other dogs and with people": one row per situation with Fine / Unsure / Not okay and an optional note.
import { View, useWindowDimensions } from 'react-native';
import { AppText, Chip, Divider, TextInput } from '@/components/common';
import { makeStyles, useTheme } from '@/theme';
import { RATE_NOTE_MAX, RATE_NOTE_PLACEHOLDER, RATE_OPTIONS, RATE_ROWS } from './kydData';
import { rateKey, rateNoteKey, type KydValues } from './kydLogic';

interface Props {
  values: KydValues;
  onChange: (key: string, value: string) => void;
}

export function KydRates({ values, onChange }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const wide = useWindowDimensions().width >= theme.sizes.breakpointWide;

  return (
    <View>
      {RATE_ROWS.map((row, i) => {
        const key = rateKey(row.key);
        const noteKey = rateNoteKey(row.key);
        const current = typeof values[key] === 'string' ? (values[key] as string) : '';
        return (
          <View key={row.key} style={styles.row}>
            {i > 0 && <Divider />}
            <View style={[styles.head, wide && styles.headWide]}>
              <AppText variant="bodyStrong" style={wide ? styles.question : undefined}>{row.label}</AppText>
              <View style={styles.choices} accessibilityRole="radiogroup" accessibilityLabel={row.label}>
                {RATE_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    label={o.label}
                    selected={current === o.value}
                    selectedTone={o.tone}
                    // Tap again to clear: every row is optional.
                    onPress={() => onChange(key, current === o.value ? '' : o.value)}
                    accessibilityLabel={`${row.label}: ${o.label}`}
                  />
                ))}
              </View>
            </View>
            <TextInput
              value={typeof values[noteKey] === 'string' ? (values[noteKey] as string) : ''}
              onChangeText={(v) => onChange(noteKey, v)}
              placeholder={RATE_NOTE_PLACEHOLDER}
              maxLength={RATE_NOTE_MAX}
              dense
              accessibilityLabel={`${row.label}: details`}
            />
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { gap: t.spacing.sm, paddingBottom: t.spacing.md },
  head: { gap: t.spacing.sm, paddingTop: t.spacing.sm },
  headWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  question: { flexShrink: 1 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
}));
