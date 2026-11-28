import React, { useCallback, useEffect, useMemo } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { clearDriverSession } from "@/service/driverSession";
import { getDriverProfile } from "@/service/rest/auth";
import { logger } from "@/utils/logger";
import DriverRegistrationScreen from "@/screens/driverOnboarding/DriverRegistrationScreen";
import RegistrationStatusScreen from "@/screens/auth/RegistrationStatusScreen";
import { TRootStack } from "@/interface/navigation.type";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "@/utils/navigation.utils";
import MainTabs from "./MainTabs";
import TripDetailsScreen from '@/screens/main/trips/TripDetailsScreen';
import ChatScreen from '@/screens/main/inbox/ChatScreen';
import SplashScreen from "@/screens/splash/SplashScreen";
import LoginScreen from "@/screens/auth/LoginScreen";
import SettingsScreen from "@/screens/settings/SettingsScreen";
import TextSizeScreen from "@/screens/settings/TextSizeScreen";
import { useThemeStore } from "@/store/themeStore";
import {
  createNavigationTheme,
  statusBarStyleForColor,
} from "@/utils/theme.utils";
import EarningLocationScreen from "@/screens/driverOnboarding/EarningLocationScreen";
import ChooseVehicleTypeScreen from "@/screens/driverOnboarding/ChooseVehicleTypeScreen";
import DrivingPreferenceScreen from "@/screens/driverOnboarding/DrivingPreferenceScreen";
import ProfileScreen from "@/screens/driverOnboarding/ProfileScreen";
import DrivingLicenseScreen from "@/screens/driverOnboarding/DrivingLicenseScreen";
import ProfilePictureScreen from "@/screens/driverOnboarding/ProfilePictureScreen";
import GovernmentIdScreen from "@/screens/driverOnboarding/GovernmentIdScreen";
import VehicleModelScreen from "@/screens/driverOnboarding/VehicleModelScreen";
import VehicleRcScreen from "@/screens/driverOnboarding/VehicleRcScreen";
import PollutionCertificateScreen from "@/screens/driverOnboarding/PollutionCertificateScreen";
import VehicleInsuranceScreen from "@/screens/driverOnboarding/VehicleInsuranceScreen";
import BankDetailsScreen from "@/screens/driverOnboarding/BankDetailsScreen";

import MyDocumentsScreen from "@/screens/main/menu/MyDocumentsScreen";
import VehicleDetailsScreen from "@/screens/main/menu/VehicleDetailsScreen";
import DocumentViewerScreen from "@/screens/main/menu/DocumentViewerScreen";
import AppLanguageScreen from "@/screens/main/menu/AppLanguageScreen";
import OrderSoundScreen from "@/screens/main/menu/OrderSoundScreen";
import NotificationsScreen from "@/screens/main/menu/NotificationsScreen";
import HelpSupportScreen from "@/screens/main/menu/HelpSupportScreen";
import SafetyScreen from "@/screens/main/menu/SafetyScreen";

const RootNavigator = createNativeStackNavigator<TRootStack>();

type ApplicationProps = {
  onRouteChange?: (routeName: string | undefined) => void;
};

function AuthenticatedMainTabs() {
  const token = useAuthStore((state) => state.token);
  const expiry = useAuthStore((state) => state.sessionExpiresAt);
  return token && expiry && expiry > Date.now() ? <MainTabs /> : null;
}

const PUBLIC_ROUTES = new Set([
  "SplashScreen",
  "LoginScreen",
  "DriverRegistrationScreen",
  "RegistrationStatusScreen",
  "SettingsScreen",
  "TextSizeScreen",
]);

export default function Application({ onRouteChange }: ApplicationProps) {
  const token = useAuthStore((state) => state.token);
  const expiresAt = useAuthStore((state) => state.sessionExpiresAt);
  const colors = useThemeStore((state) => state.themeColor);
  const mode = useThemeStore((state) => state.resolvedTheme);
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
    const session = useAuthStore.getState();
    if (
      activeRoute &&
      !PUBLIC_ROUTES.has(activeRoute.name) &&
      (!session.token ||
        !session.sessionExpiresAt ||
        session.sessionExpiresAt <= Date.now())
    ) {
      navigationRef.resetRoot({
        index: 0,
        routes: [{ name: "LoginScreen", params: { register: false } }],
      });
      return;
    }
    onRouteChange?.(activeRoute?.name);
  }, [onRouteChange]);
  useEffect(() => {
    notifyProtectedRouteChange();
    if (!token || !expiresAt) return;
    if (expiresAt > Date.now() && !useAuthStore.getState().driverProfile) {
      void getDriverProfile()
        .then((profile) => useAuthStore.getState().setDriverProfile(profile))
        .catch(() => undefined);
    }
    const expire = () => {
      if (expiresAt <= Date.now()) {
        void clearDriverSession().catch(() =>
          logger.warn("driver_session.clear_failed", { scope: "auth" }),
        );
      }
    };
    const timer = setTimeout(expire, Math.max(0, expiresAt - Date.now()));
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") expire();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [token, expiresAt, notifyProtectedRouteChange]);
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
            statusBarStyleForColor(colors.surface, mode === "dark") ===
            "light-content"
              ? "light"
              : "dark",
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
        <RootNavigator.Screen
          component={DriverRegistrationScreen}
          name="DriverRegistrationScreen"
        />
        <RootNavigator.Screen
          component={RegistrationStatusScreen}
          name="RegistrationStatusScreen"
        />
        <RootNavigator.Screen
          component={AuthenticatedMainTabs}
          name="MainStack"
        />
        <RootNavigator.Screen component={TripDetailsScreen} name="TripDetailsScreen" />
        <RootNavigator.Screen component={ChatScreen} name="ChatScreen" />
        <RootNavigator.Screen
          component={SettingsScreen}
          name="SettingsScreen"
        />
        <RootNavigator.Screen
          component={TextSizeScreen}
          name="TextSizeScreen"
        />
        <RootNavigator.Screen
          component={MyDocumentsScreen}
          name="MyDocumentsScreen"
        />
        <RootNavigator.Screen
          component={VehicleDetailsScreen}
          name="VehicleDetailsScreen"
        />
        <RootNavigator.Screen
          component={DocumentViewerScreen}
          name="DocumentViewerScreen"
        />
        <RootNavigator.Screen
          component={AppLanguageScreen}
          name="AppLanguageScreen"
        />
        <RootNavigator.Screen
          component={OrderSoundScreen}
          name="OrderSoundScreen"
        />
        <RootNavigator.Screen
          component={NotificationsScreen}
          name="NotificationsScreen"
        />
        <RootNavigator.Screen
          component={HelpSupportScreen}
          name="HelpSupportScreen"
        />
        <RootNavigator.Screen component={SafetyScreen} name="SafetyScreen" />
      </RootNavigator.Navigator>
    </NavigationContainer>
  );
}
