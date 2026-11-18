import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TDriverOnboardingStack } from './driverOnboarding.type';

export type TMainTabs = {
  Home: undefined;
  Trips: undefined;
  Earnings: undefined;
  Inbox: undefined;
  Menu: undefined;
};

export type TRootStack = TDriverOnboardingStack & {
  SplashScreen: undefined;
  LoginScreen: undefined;
  // Preserve this route ID for the deferred biometric gate and existing callers.
  MainStack: undefined;
  SettingsScreen: undefined;
  TextSizeScreen: undefined;
};

export type TSplashStackProps = NativeStackScreenProps<
  TRootStack,
  'SplashScreen'
>;
