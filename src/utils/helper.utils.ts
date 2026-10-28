import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASYNC_KEYS } from './contant.utils';
import moment from 'moment';
import { Alert, I18nManager, Linking, Share, ToastAndroid } from 'react-native';
import { EShare, OrderStatus } from '@/interface/general.type';
import { themeType } from '@/interface/theme.type';
import { navigateAndSimpleReset } from './navigation.utils';
import messaging from '@react-native-firebase/messaging';
import { stopNotificationSound } from './notification.utils';
import { clearTokens, client } from '@/service/rest';
import { logoutCustomerSession } from '@/service/rest/auth/account';
import { ENotificationType } from '@/interface/notification.type';
import { useAuthStore } from '@/store/authStore';
import i18n from '@/localizations';
import { logger } from './logger';

export const setAsyncStorage = async (key: string, value: any) => {
  if (!key) {
    console.warn('setAsyncStorage: Key is undefined or null');
    return;
  }
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const getAsyncStorage = async (key: string) => {
  if (!key) {
    console.warn('getAsyncStorage: Key is undefined or null');
    return null;
  }
  const data: any = await AsyncStorage.getItem(key);
  if (!data) return null;
  const parsedData = JSON.parse(data);
  return parsedData;
};

export const getLanguage = async () => {
  const value = await AsyncStorage.getItem(ASYNC_KEYS.LANGUAGE);
  if (value) {
    const parsedData = JSON.parse(value);
    return parsedData;
  }
  return 'en';
};

export const formatDate = (
  date: moment.MomentInput,
  format: string | undefined,
  dateFormate?: string,
) => {
  if (dateFormate) {
    return moment(date, dateFormate).format(format);
  } else {
    return moment(date).format(format);
  }
};

export const isRTL = () => {
  return I18nManager.isRTL;
};

export const showToast = (msg: string) => {
  ToastAndroid.show(msg, ToastAndroid.SHORT);
};

const getErrorStatus = (error: unknown): number | undefined =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof error.status === 'number'
    ? error.status
    : undefined;

export const onLogout = async (
  options: { reportServerFailure?: boolean } = {},
): Promise<boolean> => {
  let serverLogoutFailed = false;

  try {
    await logoutCustomerSession();
  } catch (error: unknown) {
    serverLogoutFailed = true;
    logger.warn('auth.logout_server_unavailable', {
      scope: 'auth',
      status: getErrorStatus(error),
    });
  }

  try {
    await clearTokens();
    useAuthStore.getState().resetUser();
    delete client.defaults.headers.common['Authorization'];
    // Compatibility for the deferred biometric gate; the starter has no Login route.
    navigateAndSimpleReset('MainStack');
    logger.info('auth.logout_completed', { scope: 'auth' });
    if (serverLogoutFailed && options.reportServerFailure) {
      Alert.alert(
        i18n.t('ui.errorTitle'),
        i18n.t('ride.auth.logoutServerUnavailable'),
      );
    }
    return true;
  } catch {
    logger.warn('auth.logout_failed', { scope: 'auth' });
    Alert.alert(i18n.t('ui.errorTitle'), i18n.t('ride.auth.logoutError'));
    return false;
  }
};

export const requestLogoutConfirmation = (): void => {
  Alert.alert(
    i18n.t('ride.auth.logoutConfirmTitle'),
    i18n.t('ride.auth.logoutConfirmMessage'),
    [
      { text: i18n.t('ui.cancel'), style: 'cancel' },
      {
        text: i18n.t('ride.auth.logoutConfirmAction'),
        style: 'destructive',
        onPress: () => onLogout({ reportServerFailure: true }),
      },
    ],
  );
};

export const getStatusConfig = (status: OrderStatus, themeColor: themeType) => {
  switch (status) {
    case OrderStatus.IN_PROGRESS:
    case OrderStatus.PENDING:
    case OrderStatus.REQUESTED:
      return {
        statusText: 'Pending',
        statusColor: themeColor.yellow,
        statusBgColor: themeColor.yellowS1,
      };
    case OrderStatus.COMPLETED:
      return {
        statusText: 'Completed',
        statusColor: themeColor.green,
        statusBgColor: themeColor.greenS1,
      };
    case OrderStatus.CANCELLED:
      return {
        statusText: 'Cancelled',
        statusColor: themeColor.red,
        statusBgColor: themeColor.redS1,
      };
    default:
      return {
        statusText: 'Unknown',
        statusColor: themeColor.yellow,
        statusBgColor: themeColor.yellowS1,
      };
  }
};

export const handleNavigation = (dataObj: { pressId: string; data: any }) => {
  stopNotificationSound();
  if (dataObj.data?.type === ENotificationType.EYE_SESSION_CONNECTED) {
  }
};

export const openGoogleMaps = (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
) => {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;
  return Linking.openURL(url);
};

export const timeAgo = (dateString: string): string => {
  if (dateString.trim().length === 0) return '';
  const now = moment();
  const date = moment(dateString);
  const diffInMinutes = now.diff(date, 'minutes');
  const diffInHours = now.diff(date, 'hours');
  const diffInDays = now.diff(date, 'days');

  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return date.format('DD MMM YYYY'); // e.g., "06 Sep 2025"
  }
};

// assuming you have enum for share types

export const handleShare = async (
  referralCode: string,
  type: string = EShare.LINK,
  amount: number = 5,
) => {
  try {
    const deepLink = `ENDPOINTS.SHARE.REFERRAL_CODE(referralCode)`;

    const message = `🎉 Join this amazing app and earn ₹${amount}! 
      Use my referral code: ${referralCode}.
      Download or open the app here: ${deepLink}`;

    console.log('Deeplink message: ', message);

    const links: Record<string, string> = {
      [EShare.WHATSAPP]: `whatsapp://send?text=${encodeURIComponent(message)}`,
      [EShare.FACEBOOK]: `fb://facewebmodal/f?href=https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        deepLink,
      )}`,
      [EShare.MAIL]: `mailto:?subject=${encodeURIComponent(
        `Refer & Earn ₹${amount}`,
      )}&body=${encodeURIComponent(message)}`,
    };

    if (type === EShare.LINK) {
      await Share.share({ message });
      return;
    }

    const appUrl = links[type];

    if (appUrl) {
      await Linking.openURL(appUrl);
    } else {
      await Share.share({ message });
    }
  } catch (error) {
    console.log('Error sharing:', error);
    Alert.alert('Oops!', 'Unable to share right now.');
  }
};

export const registerFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    // console.log('registerFCMToken', token);

    if (!token || typeof token !== 'string') {
      console.log('Invalid FCM token:', token);
      return;
    }

    const key = ASYNC_KEYS.FCM_TOKEN;
    if (!key) {
      console.error('ASYNC_KEYS.FCM_TOKEN is undefined');
      return;
    }

    const savedToken = await getAsyncStorage(key);

    if (token !== savedToken) {
      await setAsyncStorage(key, token);
    }
  } catch (error) {
    console.log('registerFCMToken error:', error);
  }
};

export const setupTokenRefreshListener = () => {
  return messaging().onTokenRefresh(async token => {
    console.log('setupTokenRefreshListener', token);
    if (!token || typeof token !== 'string') return;

    const key = ASYNC_KEYS.FCM_TOKEN;
    if (!key) {
      console.error('ASYNC_KEYS.FCM_TOKEN is undefined in refresh listener');
      return;
    }

    const savedToken = await getAsyncStorage(key);

    if (token !== savedToken) {
      await setAsyncStorage(key, token);
    }
  });
};

export const getSalutation = () => {
  const hour = moment().hour();
  if (hour >= 5 && hour < 12) {
    return 'common.good_morning';
  } else if (hour >= 12 && hour < 17) {
    return 'common.good_afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'common.good_evening';
  } else {
    return 'common.good_night';
  }
};
