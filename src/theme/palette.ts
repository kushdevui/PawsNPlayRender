// Raw brand colours. Nothing outside src/theme should import this file:
// components use the semantic colours in themes.ts via useTheme()/makeStyles().
// To rebrand, change these values (or add a new palette) - the whole app follows.

export const palette = {
  // Brand - sampled from the Paws N' Play logo
  pink50: '#FAF6F9',
  pink100: '#F3EBF2',
  pink200: '#E4D3E2',
  pink300: '#D3BAD0',
  pink400: '#C2A1BE', // logo pink
  pink500: '#AD87A8',
  pink600: '#8E6A8A', // readable pink for text on white
  pink700: '#6F5170',

  ink900: '#262727', // logo black
  ink700: '#3F4040',
  ink500: '#6B6C6C',
  ink400: '#8E8F8F',
  ink300: '#C7C8C8',
  ink200: '#E3E4E4',
  ink100: '#F2F2F2',
  white: '#FFFFFF',

  red600: '#C62828',
  red50: '#FDECEC',
  green600: '#2E7D32',
  green50: '#E8F5E9',
  amber600: '#B26A00',
  amber50: '#FFF4E0',
  blue600: '#1E5BB8',
  blue50: '#E8F0FC',
} as const;

export type PaletteColor = keyof typeof palette;
