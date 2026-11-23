// Semantic themes. Components only ever use these names (colors.primary, colors.text, ...),
// never raw hex values, so a new theme (dark mode, rebrand) is just another object here.
import type { TextStyle } from 'react-native';
import { palette } from './palette';
import { fontFamily, fontSize, fontWeight, radius, sizes, spacing } from './tokens';

export interface ThemeColors {
  background: string; // screen background
  surface: string; // cards, inputs
  surfaceMuted: string; // subtle fills (chips, pressed rows)
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string; // text on dark backgrounds

  primary: string; // main CTA background (brand pink)
  primaryPressed: string;
  onPrimary: string; // text/icons on primary
  primarySoft: string; // tinted backgrounds
  primaryText: string; // brand colour used as text/links on white (accessible)

  secondary: string; // dark CTA (brand black)
  secondaryPressed: string;
  onSecondary: string;

  border: string;
  borderStrong: string;
  borderFocus: string;
  placeholder: string;
  disabled: string;
  onDisabled: string;

  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;

  overlay: string;
  statusBar: 'dark' | 'light';
}

export type TypographyVariant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyStrong' | 'label' | 'caption' | 'button' | 'link';

const typography = (colors: ThemeColors): Record<TypographyVariant, TextStyle> => ({
  display: { fontSize: fontSize.display, fontWeight: fontWeight.heavy, color: colors.text, fontFamily: fontFamily.bold, lineHeight: 40 },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text, fontFamily: fontFamily.bold, lineHeight: 34 },
  heading: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, fontFamily: fontFamily.bold, lineHeight: 28 },
  subheading: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, fontFamily: fontFamily.medium, lineHeight: 24 },
  body: { fontSize: fontSize.md, fontWeight: fontWeight.regular, color: colors.text, fontFamily: fontFamily.regular, lineHeight: 22 },
  bodyStrong: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text, fontFamily: fontFamily.medium, lineHeight: 22 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, fontFamily: fontFamily.medium, lineHeight: 18 },
  caption: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, color: colors.textMuted, fontFamily: fontFamily.regular, lineHeight: 18 },
  button: { fontSize: fontSize.md, fontWeight: fontWeight.bold, fontFamily: fontFamily.bold, lineHeight: 20 },
  link: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primaryText, fontFamily: fontFamily.medium, lineHeight: 18 },
});

const lightColors: ThemeColors = {
  background: palette.white,
  surface: palette.white,
  surfaceMuted: palette.pink50,
  text: palette.ink900,
  textMuted: palette.ink500,
  textSubtle: palette.ink400,
  textInverse: palette.white,

  primary: palette.pink400,
  primaryPressed: palette.pink500,
  onPrimary: palette.ink900,
  primarySoft: palette.pink100,
  primaryText: palette.pink600,

  secondary: palette.ink900,
  secondaryPressed: palette.ink700,
  onSecondary: palette.white,

  border: palette.ink200,
  borderStrong: palette.ink300,
  borderFocus: palette.pink400,
  placeholder: palette.ink400,
  disabled: palette.ink100,
  onDisabled: palette.ink400,

  danger: palette.red600,
  dangerSoft: palette.red50,
  success: palette.green600,
  successSoft: palette.green50,
  warning: palette.amber600,
  warningSoft: palette.amber50,
  info: palette.blue600,
  infoSoft: palette.blue50,

  overlay: 'rgba(38, 39, 39, 0.4)',
  statusBar: 'dark',
};

const buildTheme = (name: string, colors: ThemeColors) => ({
  name,
  colors,
  spacing,
  radius,
  sizes,
  fontSize,
  fontWeight,
  typography: typography(colors),
});

export const lightTheme = buildTheme('light', lightColors);

export type AppTheme = ReturnType<typeof buildTheme>;

// Register more themes here (e.g. darkTheme) and pick one in ThemeProvider.
export const themes = { light: lightTheme } as const;
export type ThemeName = keyof typeof themes;
