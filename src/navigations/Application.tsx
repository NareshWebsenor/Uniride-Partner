import React, { useCallback, useMemo } from 'react';
import { TRootStack } from '@/interface/navigation.type';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from '@/utils/navigation.utils';
import HomeScreen from '@/screens/main/tab/HomeScreen';
import SplashScreen from '@/screens/splash/SplashScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import { useThemeStore } from '@/store/themeStore';
import { createNavigationTheme } from '@/theme/navigationTheme';

const RootNavigator = createNativeStackNavigator<TRootStack>();

type ApplicationProps = {
  onRouteChange?: (routeName: string | undefined) => void;
};

export default function Application({ onRouteChange }: ApplicationProps) {
  const colors = useThemeStore(state => state.themeColor);
  const mode = useThemeStore(state => state.resolvedTheme);
  const navigationTheme = useMemo(
    () => createNavigationTheme(mode, colors),
    [mode, colors],
  );
  const notifyProtectedRouteChange = useCallback(() => {
    if (!navigationRef.isReady()) {
      return;
    }
    const rootState = navigationRef.getRootState();
    const activeRoute = rootState.routes[rootState.index];
    onRouteChange?.(activeRoute?.name);
  }, [onRouteChange]);
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={notifyProtectedRouteChange}
      onStateChange={notifyProtectedRouteChange}
    >
      <RootNavigator.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{ headerShown: false }}
      >
        <RootNavigator.Screen component={SplashScreen} name="SplashScreen" />
        <RootNavigator.Screen component={HomeScreen} name="MainStack" />
        <RootNavigator.Screen
          component={SettingsScreen}
          name="SettingsScreen"
        />
      </RootNavigator.Navigator>
    </NavigationContainer>
  );
}
