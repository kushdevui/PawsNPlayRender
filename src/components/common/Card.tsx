import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';
import { makeStyles } from '@/theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Outlined card (Paper Card) - flat and minimal to match the brand. */
export function Card({ children, onPress, style, accessibilityLabel }: Props) {
  const styles = useStyles();
  return (
    <PaperCard mode="outlined" onPress={onPress} style={[styles.card, style]} accessibilityLabel={accessibilityLabel}>
      <PaperCard.Content style={styles.content}>{children}</PaperCard.Content>
    </PaperCard>
  );
}

const useStyles = makeStyles((t) => ({
  card: { borderRadius: t.radius.lg, borderColor: t.colors.border, backgroundColor: t.colors.surface },
  content: { gap: t.spacing.xs, paddingVertical: t.spacing.lg },
}));
