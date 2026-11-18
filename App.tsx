import React, { useEffect, useState } from 'react';
import { ContextProvider } from '@/context/ContextFile';
import { ToastProvider } from '@/components/ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { MenuProvider } from 'react-native-popup-menu';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { initializeTheme, useThemeStore } from '@/store/themeStore';
import { initializeLanguage } from '@/store/languageStore';
import { initializeTextSize } from '@/store/textSizeStore';
import { ThemeProvider } from '@/utils/theme.utils';
import Application from '@/navigations/Application';
import { SplashContent } from '@/screens/splash/SplashScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  const isDarkTheme = useThemeStore(state => state.isDarkTheme);
  const setSystemTheme = useThemeStore(state => state.setSystemTheme);
  useEffect(() => {
    let mounted = true;
    Promise.all([
      initializeTheme(),
      initializeLanguage(),
      initializeTextSize(),
    ]).then(() => {
      if (mounted) {
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider
            isDarkTheme={isDarkTheme}
            onSystemThemeChange={setSystemTheme}
          >
            <ContextProvider>
              <ToastProvider>
                <MenuProvider>
                  {ready ? <Application /> : <SplashContent />}
                </MenuProvider>
              </ToastProvider>
            </ContextProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
