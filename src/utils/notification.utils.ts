import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
} from '@notifee/react-native';
import { OrderStatus } from '@/interface/general.type';
import { COMMON_KEYS } from './contant.utils';

let currentNotificationId: string | null = null;

export async function setChannelGroups() {
  // Channel with ring sound
  await notifee.createChannel({
    id: 'order_notifications',
    name: 'Order Notifications',
    lights: false,
    vibration: true,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'ring', // Ensure ring.mp3 exists in android/app/src/main/res/raw/
  });

  // Silent channel
  await notifee.createChannel({
    id: 'silent_notifications',
    name: 'Silent Notifications',
    lights: false,
    vibration: true,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: undefined, // No sound
  });
}

export async function onMessageReceived(notificationData: any) {
  const { title, body, data } = notificationData?.data || {};

  console.log('onMessageReceived------->', title, body);

  let dataObj: any = {
    pressId: COMMON_KEYS.PRESS_ID,
    data: notificationData?.data,
  };

  console.log('dataObj--->', dataObj);

  // Choose channel dynamically
  const channelId =
    dataObj?.type === `ORDER_${OrderStatus.REQUESTED}`
      ? 'order_notifications'
      : 'silent_notifications';

  const notificationId = await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      color: '#19A7CE',
      pressAction: {
        id: COMMON_KEYS.PRESS_ID,
        launchActivity: 'default',
      },
    },
    ios: {},
    data: { dataObj },
  });

  currentNotificationId = notificationId;
}

export const stopNotificationSound = async () => {
  if (currentNotificationId) {
    await notifee.cancelNotification(currentNotificationId); // Cancel only the specific notification
    currentNotificationId = null; // Reset
  }
};

export async function requestUserPermission() {
  const settings = await notifee.requestPermission();

  if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    console.log('Notification permission granted');
  } else {
    console.log('User declined permissions');
  }
}
