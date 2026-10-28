import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { ResolvedTheme, ThemeColors } from './colors';

export function createNavigationTheme(
  mode: ResolvedTheme,
  colors: ThemeColors,
): Theme {
  return {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    dark: mode === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.error,
    },
  };
}
