import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { toPaperTheme } from './paperTheme';
import { themes, type AppTheme, type ThemeName } from './themes';

interface ThemeContextValue {
  theme: AppTheme;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Provides our app theme AND the React Native Paper theme derived from it.
 * Switching themeName restyles both our components and every Paper component.
 */
export function ThemeProvider({ children, initialTheme = 'light' }: { children: ReactNode; initialTheme?: ThemeName }) {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);
  const value = useMemo(() => ({ theme: themes[themeName], themeName, setThemeName }), [themeName]);
  const paperTheme = useMemo(() => toPaperTheme(value.theme), [value.theme]);

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider
        theme={paperTheme}
        settings={{ icon: (props) => <MaterialCommunityIcons {...(props as any)} /> }}
      >
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

/** Current theme: colors, spacing, radius, typography, sizes. */
export function useTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx.theme;
}

/** Switch theme at runtime (e.g. a future dark-mode toggle). */
export function useThemeSwitcher() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeSwitcher must be used inside <ThemeProvider>');
  return { themeName: ctx.themeName, setThemeName: ctx.setThemeName };
}

/**
 * Theme-aware StyleSheet. Define once at module level, call the hook in the component:
 *
 *   const useStyles = makeStyles((t) => ({ box: { padding: t.spacing.lg, backgroundColor: t.colors.surface } }));
 *   function Comp() { const styles = useStyles(); ... }
 */
type AnyStyle = ViewStyle | TextStyle | ImageStyle;
type NamedStyles<T> = { [P in keyof T]: AnyStyle };

// `T & NamedStyles<any>` gives the factory's object literal a contextual type, so values like
// 'row' / 'center' stay literal types (React Native 0.88 types removed StyleSheet.NamedStyles).
export function makeStyles<T extends NamedStyles<T> | NamedStyles<any>>(factory: (theme: AppTheme) => T & NamedStyles<any>) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)) as T, [theme]);
  };
}
