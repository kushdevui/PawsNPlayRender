import { useTheme } from '@/theme';

/** Shared, themed header options for stack screens (forms, detail pages). */
export function useStackScreenOptions() {
  const t = useTheme();
  return {
    headerShadowVisible: false,
    headerStyle: { backgroundColor: t.colors.background },
    headerTintColor: t.colors.text,
    headerTitleStyle: { fontSize: t.fontSize.lg, fontWeight: t.fontWeight.bold },
    headerBackButtonDisplayMode: 'minimal' as const,
    contentStyle: { backgroundColor: t.colors.background },
  };
}
