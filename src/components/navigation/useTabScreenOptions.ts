import { useTheme } from '@/theme';

/** Shared, themed tab bar options for every role's Tabs. */
export function useTabScreenOptions() {
  const t = useTheme();
  return {
    headerShown: false,
    tabBarActiveTintColor: t.colors.text,
    tabBarInactiveTintColor: t.colors.textSubtle,
    tabBarActiveBackgroundColor: t.colors.background,
    tabBarStyle: { backgroundColor: t.colors.background, borderTopColor: t.colors.border },
    tabBarLabelStyle: { fontSize: t.fontSize.xs, fontWeight: t.fontWeight.semibold },
  };
}
