import { Avatar as PaperAvatar } from 'react-native-paper';
import { useTheme } from '@/theme';

const initialsOf = (name: string) =>
  name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

/** User/pet avatar (Paper Avatar): photo if given, otherwise initials on brand pink. */
export function Avatar({ name, imageUrl, size = 56 }: { name: string; imageUrl?: string | null; size?: number }) {
  const theme = useTheme();
  if (imageUrl) return <PaperAvatar.Image size={size} source={{ uri: imageUrl }} accessibilityLabel={name} />;
  return (
    <PaperAvatar.Text
      size={size}
      label={initialsOf(name)}
      color={theme.colors.onPrimary}
      style={{ backgroundColor: theme.colors.primary }}
      accessibilityLabel={name}
    />
  );
}
