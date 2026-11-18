import type { PropsWithChildren } from 'react';

/** Shared color contract for both palettes in utils/theme.utils.ts. */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceRaised: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  onPrimary: string;
  tabActiveBackground: string;
  tabInactive: string;
  toggleActive: string;
  toggleInactive: string;
  driverAvailable: string;
  onDriverAvailable: string;
  success: string;
  warning: string;
  error: string;
  disabled: string;
  overlay: string;
  transparent: string;
  shadow: string;
  onImage: string;
  googleBlue: string;
  googleGreen: string;
  googleYellow: string;
  googleRed: string;
  brandAccent: string;
  onBrandAccent: string;
  brandMark: string;
  onBrandMark: string;
  brandLink: string;
  confirmation: string;
  onConfirmation: string;
  backgroundColor: string;
  backgroundColorS1: string;
  backgroundColorS2: string;
  backgroundColorS3: string;
  primaryS1: string;
  primaryS2: string;
  primaryS3: string;
  secondary: string;
  secondaryS1: string;
  secondaryS2: string;
  tertiary: string;
  text: string;
  textS1: string;
  textS2: string;
  descriptionText: string;
  extraLightText: string;
  lightTextBlack: string;
  lightTextwhite: string;
  borderColor: string;
  placeHolderColor: string;
  white: string;
  black: string;
  red: string;
  redS1: string;
  gray: string;
  grayS1: string;
  grayS2: string;
  grayS3: string;
  green: string;
  greenS1: string;
  greenS2: string;
  brown: string;
  yellow: string;
  yellowS1: string;
  lightOrange: string;
  gold: string;
  goldLight: string;
  goldLighter: string;
  goldGradient: string[];
}

export type themeType = ThemeColors;
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemeMode, 'system'>;

export interface ThemeProviderProps extends PropsWithChildren {
  isDarkTheme: boolean;
  onSystemThemeChange: (scheme: ResolvedTheme) => void;
}
