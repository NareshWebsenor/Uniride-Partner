import React, { useCallback, useMemo } from 'react';
import { TRootStack } from '@/interface/navigation.type';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from '@/utils/navigation.utils';
import MainTabs from './MainTabs';
import SplashScreen from '@/screens/splash/SplashScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import TextSizeScreen from '@/screens/settings/TextSizeScreen';
import { useThemeStore } from '@/store/themeStore';
import {
  createNavigationTheme,
  statusBarStyleForColor,
} from '@/utils/theme.utils';
import EarningLocationScreen from '@/screens/driverOnboarding/EarningLocationScreen';
import ChooseVehicleTypeScreen from '@/screens/driverOnboarding/ChooseVehicleTypeScreen';
import DrivingPreferenceScreen from '@/screens/driverOnboarding/DrivingPreferenceScreen';
import ProfileScreen from '@/screens/driverOnboarding/ProfileScreen';
import DrivingLicenseScreen from '@/screens/driverOnboarding/DrivingLicenseScreen';
import ProfilePictureScreen from '@/screens/driverOnboarding/ProfilePictureScreen';
import GovernmentIdScreen from '@/screens/driverOnboarding/GovernmentIdScreen';
import VehicleModelScreen from '@/screens/driverOnboarding/VehicleModelScreen';
import VehicleRcScreen from '@/screens/driverOnboarding/VehicleRcScreen';
import PollutionCertificateScreen from '@/screens/driverOnboarding/PollutionCertificateScreen';
import VehicleInsuranceScreen from '@/screens/driverOnboarding/VehicleInsuranceScreen';
import BankDetailsScreen from '@/screens/driverOnboarding/BankDetailsScreen';

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
        screenOptions={{
          headerShown: false,
          statusBarStyle:
            statusBarStyleForColor(colors.surface, mode === 'dark') ===
            'light-content'
              ? 'light'
              : 'dark',
        }}
      >
        <RootNavigator.Screen component={SplashScreen} name="SplashScreen" />
        <RootNavigator.Screen
          component={LoginScreen}
          name="LoginScreen"
          options={{
            statusBarTranslucent: true,
          }}
        />
        <RootNavigator.Screen
          component={EarningLocationScreen}
          name="EarningLocationScreen"
        />
        <RootNavigator.Screen
          component={ChooseVehicleTypeScreen}
          name="ChooseVehicleTypeScreen"
        />
        <RootNavigator.Screen
          component={DrivingPreferenceScreen}
          name="DrivingPreferenceScreen"
        />
        <RootNavigator.Screen component={ProfileScreen} name="ProfileScreen" />
        <RootNavigator.Screen
          component={DrivingLicenseScreen}
          name="DrivingLicenseScreen"
        />
        <RootNavigator.Screen
          component={ProfilePictureScreen}
          name="ProfilePictureScreen"
        />
        <RootNavigator.Screen
          component={GovernmentIdScreen}
          name="GovernmentIdScreen"
        />
        <RootNavigator.Screen
          component={VehicleModelScreen}
          name="VehicleModelScreen"
        />
        <RootNavigator.Screen
          component={VehicleRcScreen}
          name="VehicleRcScreen"
        />
        <RootNavigator.Screen
          component={PollutionCertificateScreen}
          name="PollutionCertificateScreen"
        />
        <RootNavigator.Screen
          component={VehicleInsuranceScreen}
          name="VehicleInsuranceScreen"
        />
        <RootNavigator.Screen
          component={BankDetailsScreen}
          name="BankDetailsScreen"
        />
        <RootNavigator.Screen component={MainTabs} name="MainStack" />
        <RootNavigator.Screen
          component={SettingsScreen}
          name="SettingsScreen"
        />
        <RootNavigator.Screen component={TextSizeScreen} name="TextSizeScreen" />
      </RootNavigator.Navigator>
    </NavigationContainer>
  );
}
