import { Chip as PaperChip } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';
import type { IconName } from './Icon';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Shows an × to clear (e.g. an active date filter). */
  onClose?: () => void;
}

/** Filter / choice chip (Paper Chip). Selected = black fill, white text. */
export function Chip({ label, selected = false, onPress, icon, onClose }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <PaperChip
      mode="outlined"
      selected={selected}
      showSelectedCheck={false}
      onPress={onPress}
      onClose={onClose}
      icon={icon}
      compact
      style={[styles.chip, selected && { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary }]}
      textStyle={[styles.text, { color: selected ? theme.colors.onSecondary : theme.colors.text }]}
      selectedColor={selected ? theme.colors.onSecondary : theme.colors.text}
      accessibilityState={{ selected }}
    >
      {label}
    </PaperChip>
  );
}

const useStyles = makeStyles((t) => ({
  chip: { borderRadius: t.radius.pill, borderColor: t.colors.border, backgroundColor: t.colors.surface },
  text: { fontSize: t.fontSize.sm, fontWeight: t.fontWeight.medium, marginVertical: t.spacing.xs },
}));
