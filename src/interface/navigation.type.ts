import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  DocumentKind,
  TDriverOnboardingStack,
} from './driverOnboarding.type';

export type TMainTabs = {
  Home: undefined;
  Trips: undefined;
  Earnings: undefined;
  Inbox: undefined;
  Menu: undefined;
};

export type TRootStack = TDriverOnboardingStack & {
  SplashScreen: undefined;
  LoginScreen: { email?: string; register?: boolean; notice?: string } | undefined;
  DriverRegistrationScreen: undefined;
  RegistrationStatusScreen: { state: 'pending_review' | 'activation_pending'; email: string };
  // Preserve this route ID for the deferred biometric gate and existing callers.
  MainStack: undefined;
  TripDetailsScreen: { tripId: string };
  ChatScreen: { conversationId: string };
  SettingsScreen: undefined;
  TextSizeScreen: undefined;
  MyDocumentsScreen: undefined;
  VehicleDetailsScreen: undefined;
  DocumentViewerScreen: { kind: DocumentKind };
  AppLanguageScreen: undefined;
  OrderSoundScreen: undefined;
  NotificationsScreen: undefined;
  HelpSupportScreen: undefined;
  SafetyScreen: undefined;
};

export type TSplashStackProps = NativeStackScreenProps<
  TRootStack,
  'SplashScreen'
>;
