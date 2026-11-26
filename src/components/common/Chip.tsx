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
  /** Fill when selected: black (default), or green / red / pink for answer scales like Fine / Not okay / Unsure. */
  selectedTone?: ChipTone;
  /** Screen-reader label when the visible label needs context (e.g. "Men: Fine"). Defaults to `label`. */
  accessibilityLabel?: string;
}

export type ChipTone = 'default' | 'success' | 'danger' | 'accent';

/** Filter / choice chip (Paper Chip). Selected = black fill, white text. */
export function Chip({ label, selected = false, onPress, icon, onClose, selectedTone = 'default', accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const fill = {
    default: theme.colors.secondary,
    success: theme.colors.success,
    danger: theme.colors.danger,
    accent: theme.colors.primaryText,
  }[selectedTone];
  const onFill = selectedTone === 'default' ? theme.colors.onSecondary : theme.colors.textInverse;
  return (
    <PaperChip
      mode="outlined"
      selected={selected}
      showSelectedCheck={false}
      onPress={onPress}
      onClose={onClose}
      icon={icon}
      compact
      style={[styles.chip, selected && { backgroundColor: fill, borderColor: fill }]}
      textStyle={[styles.text, { color: selected ? onFill : theme.colors.text }]}
      selectedColor={selected ? onFill : theme.colors.text}
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {label}
    </PaperChip>
  );
}

const useStyles = makeStyles((t) => ({
  chip: { borderRadius: t.radius.pill, borderColor: t.colors.border, backgroundColor: t.colors.surface },
  text: { fontSize: t.fontSize.sm, fontWeight: t.fontWeight.medium, marginVertical: t.spacing.xs },
}));
