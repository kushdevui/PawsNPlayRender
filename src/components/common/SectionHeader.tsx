import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

/** Section title with optional count and right-side link ("See all"). */
export function SectionHeader({ title, count, actionLabel, onAction }: { title: string; count?: number; actionLabel?: string; onAction?: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <AppText variant="subheading" style={styles.title}>
        {title}
        {count !== undefined && <AppText variant="subheading" color="textSubtle">{`  ${count}`}</AppText>}
      </AppText>
      {!!actionLabel && !!onAction && <Button title={actionLabel} variant="link" onPress={onAction} />}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: t.spacing.md },
  title: { flex: 1 },
}));
