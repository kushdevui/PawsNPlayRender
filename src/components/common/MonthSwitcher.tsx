import { View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import { addMonths, formatMonth } from '@/utils/date';
import { AppText } from './AppText';

/** ‹ November 2026 › - pick the month to view. */
export function MonthSwitcher({ month, onChange }: { month: Date; onChange: (month: Date) => void }) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <IconButton icon="chevron-left" iconColor={theme.colors.text} onPress={() => onChange(addMonths(month, -1))} accessibilityLabel="Previous month" />
      <AppText variant="subheading">{formatMonth(month)}</AppText>
      <IconButton icon="chevron-right" iconColor={theme.colors.text} onPress={() => onChange(addMonths(month, 1))} accessibilityLabel="Next month" />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
}));
