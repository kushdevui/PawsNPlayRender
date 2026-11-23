import { View } from 'react-native';
import { Divider as PaperDivider } from 'react-native-paper';
import { makeStyles } from '@/theme';
import { AppText } from './AppText';

/** Horizontal rule (Paper Divider), optionally with a centred label ("or", "Test accounts"). */
export function Divider({ label }: { label?: string }) {
  const styles = useStyles();
  if (!label) return <PaperDivider style={styles.full} />;
  return (
    <View style={styles.row}>
      <PaperDivider style={styles.line} />
      <AppText variant="caption" color="textSubtle">{label}</AppText>
      <PaperDivider style={styles.line} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, alignSelf: 'stretch' },
  line: { flex: 1, backgroundColor: t.colors.border },
  full: { alignSelf: 'stretch', backgroundColor: t.colors.border },
}));
