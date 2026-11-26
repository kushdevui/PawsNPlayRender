// Size, spacing and type tokens shared by every theme.

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

// Set to custom font names once fonts are loaded (e.g. with expo-font).
// undefined = platform system font.
export const fontFamily = {
  regular: undefined as string | undefined,
  medium: undefined as string | undefined,
  bold: undefined as string | undefined,
};

export const sizes = {
  controlSm: 36, // small buttons/inputs
  controlMd: 48, // default - also the minimum touch target
  controlLg: 56,
  icon: 20,
  iconSm: 16,
  iconLg: 24,
  borderWidth: 1,
  focusBorderWidth: 1.5,
  logoSm: 44, // header logo height
  logoLg: 140, // hero logo height
  contentMaxWidth: 860, // max content width on wide screens (web/desktop)
  breakpointWide: 640, // window width from which layouts switch to their wide variant
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
