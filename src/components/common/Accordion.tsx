import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface Props {
  title: string;
  /** Controlled: the parent owns which items are open (e.g. search opens matches). */
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Collapsible item (FAQ question, details row). Tap the title row to expand / collapse. */
export function AccordionItem({ title, expanded, onToggle, children, style }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.item, expanded && styles.itemOpen, style]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
        accessibilityHint={expanded ? 'Collapses the answer' : 'Expands the answer'}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <AppText variant="bodyStrong" style={styles.title}>{title}</AppText>
        <View style={styles.iconWrap}>
          <Icon name={expanded ? 'minus' : 'plus'} size={theme.sizes.iconSm} color="primaryText" />
        </View>
      </Pressable>
      {expanded && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  item: {
    borderWidth: t.sizes.borderWidth,
    borderColor: t.colors.border,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    overflow: 'hidden',
  },
  itemOpen: { borderColor: t.colors.borderFocus },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: t.sizes.controlMd,
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
  },
  headerPressed: { backgroundColor: t.colors.surfaceMuted },
  title: { flex: 1 },
  iconWrap: {
    width: t.sizes.iconLg,
    height: t.sizes.iconLg,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.lg, gap: t.spacing.sm },
}));
