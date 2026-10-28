import React, { PropsWithChildren, useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

/** Native appearance changes only affect users who selected System mode. */
export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const setSystemTheme = useThemeStore(state => state.setSystemTheme);
  const isDark = useThemeStore(state => state.isDarkTheme);

  useEffect(() => {
    setSystemTheme(scheme);
  }, [scheme, setSystemTheme]);

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {children}
    </>
  );
}
