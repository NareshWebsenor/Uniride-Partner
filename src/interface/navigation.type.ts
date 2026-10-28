import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TRootStack = {
  SplashScreen: undefined;
  // Preserve this route ID for the deferred biometric gate and existing callers.
  MainStack: undefined;
  SettingsScreen: undefined;
};

export type TSplashStackProps = NativeStackScreenProps<
  TRootStack,
  'SplashScreen'
>;
