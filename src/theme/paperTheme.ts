// Builds the React Native Paper (Material Design 3) theme FROM our app theme,
// so Paper components automatically follow the brand. Never edit colours here -
// change palette.ts / themes.ts and this follows.
import { MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';
import type { AppTheme } from './themes';
import { fontFamily } from './tokens';

export function toPaperTheme(t: AppTheme): MD3Theme {
  const c = t.colors;
  const fonts = fontFamily.regular ? configureFonts({ config: { fontFamily: fontFamily.regular } }) : MD3LightTheme.fonts;

  return {
    ...MD3LightTheme,
    dark: false,
    roundness: 3, // MD3 multiplies this; components also get explicit radii from our tokens
    fonts,
    colors: {
      ...MD3LightTheme.colors,
      primary: c.primary,
      onPrimary: c.onPrimary,
      primaryContainer: c.primarySoft,
      onPrimaryContainer: c.text,
      secondary: c.secondary,
      onSecondary: c.onSecondary,
      secondaryContainer: c.primarySoft,
      onSecondaryContainer: c.text,
      tertiary: c.primaryText,
      onTertiary: c.textInverse,
      background: c.background,
      onBackground: c.text,
      surface: c.surface,
      onSurface: c.text,
      surfaceVariant: c.surfaceMuted,
      onSurfaceVariant: c.textMuted,
      surfaceDisabled: c.disabled,
      onSurfaceDisabled: c.onDisabled,
      outline: c.borderStrong,
      outlineVariant: c.border,
      error: c.danger,
      onError: c.textInverse,
      errorContainer: c.dangerSoft,
      onErrorContainer: c.danger,
      backdrop: c.overlay,
      elevation: {
        level0: 'transparent',
        level1: c.surface,
        level2: c.surface,
        level3: c.surfaceMuted,
        level4: c.surfaceMuted,
        level5: c.surfaceMuted,
      },
    },
  };
}
