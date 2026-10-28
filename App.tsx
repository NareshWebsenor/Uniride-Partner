import React, { useEffect, useState } from 'react';
import { ContextProvider } from '@/context/ContextFile';
import { ToastProvider } from '@/components/ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { MenuProvider } from 'react-native-popup-menu';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeTheme } from '@/store/themeStore';
import { initializeLanguage } from '@/store/languageStore';
import { ThemeProvider } from '@/theme/ThemeProvider';
import Application from '@/navigations/Application';
import { SplashContent } from '@/screens/splash/SplashScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    Promise.all([initializeTheme(), initializeLanguage()]).then(() => {
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
        <ThemeProvider>
          <ContextProvider>
            <ToastProvider>
              <MenuProvider>
                {ready ? <Application /> : <SplashContent />}
              </MenuProvider>
            </ToastProvider>
          </ContextProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
