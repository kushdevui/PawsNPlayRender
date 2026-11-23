import type { StyleProp, ViewStyle } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { makeStyles, useTheme } from '@/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

/** Search input (Paper Searchbar), flat and outlined to match the brand. */
export function SearchBar({ value, onChangeText, placeholder = 'Search', style }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Searchbar
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      mode="bar"
      elevation={0}
      iconColor={theme.colors.textMuted}
      placeholderTextColor={theme.colors.placeholder}
      inputStyle={styles.input}
      style={[styles.bar, style]}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    backgroundColor: t.colors.surfaceMuted,
    borderRadius: t.radius.md,
    height: t.sizes.controlMd,
  },
  input: { fontSize: t.fontSize.md, color: t.colors.text, minHeight: 0 },
}));
