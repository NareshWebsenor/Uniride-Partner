// import Geolocation from '@react-native-community/geolocation';
import { Alert, Linking, Platform } from 'react-native';
import {
  check,
  PERMISSIONS,
  RESULTS,
  openSettings,
  request,
  checkNotifications,
  requestNotifications,
} from 'react-native-permissions';

export const Camera = 'Camera';
export const MediaLibrary = 'MediaLibrary';
export const Notifications = 'Notifications';
export const PhotoLibrary = 'PhotoLibrary';

export const CheckPermission = async (VALUE: any) => {
  let result = await check(VALUE);
  switch (result) {
    case RESULTS.DENIED:
      return false;
    case RESULTS.GRANTED:
      return true;
    case RESULTS.BLOCKED:
      openSettings();
      return false;
      break;
  }
};

export const CheckPermission2 = async (permissionType: any) => {
  try {
    const result = await check(permissionType);
    switch (result) {
      case RESULTS.DENIED:
        return false;
      case RESULTS.GRANTED:
        return true;
      case RESULTS.BLOCKED:
        return false;
    }
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

export const requestPermission = async (permissionType: any) => {
  let msg = 'Please enable the required permission in your app settings.';
  if (
    permissionType == PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION ||
    permissionType == PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
  ) {
    msg = 'Please enable the Location permission in your app settings.';
  }

  try {
    const result = await request(permissionType);
    if (result === RESULTS.BLOCKED) {
      openSetting(msg);
      return false;
    } else if (result === RESULTS.DENIED) {
      // Permission denied
      return false;
    } else if (result === RESULTS.GRANTED) {
      // Permission blocked
      return true;
    }
  } catch (error) {
    console.error('Error requesting permission:', error);
    return false;
  }
};

export const openSetting = (msg: string) => {
  Alert.alert('Permission Blocked', msg, [
    {
      text: 'Cancel',
      style: 'cancel',
      onPress: () => {},
    },
    {
      text: 'Open Settings',
      onPress: () => openSettings(),
    },
  ]);
};

export const CheckMediaPermissions = async () => {
  let data = {
    status: true,
  };
  if (Platform.OS == 'ios') {
    try {
      const hasPermission = await CheckPermission(
        Platform.select({
          ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
        }),
      );
      if (hasPermission) {
        return data;
      } else {
        const result = await requestPermission(
          Platform.select({
            ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
          }),
        );
        if (result) {
          return data;
        } else {
          return { ...data, status: false };
        }
      }
    } catch (err) {
      return { ...data, status: false };
    }
  } else {
    return data;
  }
};

export const requestNotificationPermission = async () => {
  try {
    let permissionGranted = false;

    while (!permissionGranted) {
      const { status } = await checkNotifications();

      if (status === 'granted') {
        console.log('Notification permission already granted');
        return true;
      }

      if (status === 'blocked') {
        console.log('Notification permission blocked');
        showSettingsAlert();
        return false;
      }

      const { status: newStatus } = await requestNotifications([
        'alert',
        'sound',
        'badge',
      ]);

      if (newStatus === 'granted') {
        console.log('Notification permission granted');
        permissionGranted = true;
        return true;
      }

      if (newStatus === 'blocked') {
        console.log('Notification permission blocked after request');
        showSettingsAlert();
        return false;
      }

      console.log('User denied permission, requesting again...');
    }
  } catch (error) {
    console.error(
      'Error checking or requesting notification permission:',
      error,
    );
    return false;
  }
};

export const showSettingsAlert = () => {
  Alert.alert(
    'Enable Notifications',
    'Notifications are disabled. Please enable them in settings to get orders.',
    [
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        },
      },
    ],
  );
};

export const requestMicrophonePermission = async () => {
  const permissionType = Platform.select({
    ios: PERMISSIONS.IOS.MICROPHONE,
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
  });

  const msg = 'Please enable Microphone permission in your app settings.';

  try {
    const result = await check(permissionType!);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    if (result === RESULTS.DENIED) {
      // Try requesting the permission again
      const requestResult = await request(permissionType!);

      if (requestResult === RESULTS.GRANTED) {
        return true;
      } else if (requestResult === RESULTS.BLOCKED) {
        openSetting(msg);
        return false;
      } else {
        // Denied again
        return false;
      }
    }

    if (result === RESULTS.BLOCKED) {
      openSetting(msg);
      return false;
    }

    return false; // fallback for other unexpected statuses
  } catch (error) {
    console.error('Error checking/requesting microphone permission:', error);
    return false;
  }
};

// export const requestLocationPermissions = async () => {
//   const permission =
//     Platform.OS === 'ios'
//       ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
//       : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

//   let permissionGranted = false;

//   while (!permissionGranted) {
//     const result = await check(permission);

//     if (result === RESULTS.GRANTED) {
//       await checkLocationAvailability();
//       return true;
//     }

//     if (result === RESULTS.BLOCKED) {
//       console.log('Location permission blocked');
//       showLocationSettingsAlert();
//       return false;
//     }

//     const requestResult = await request(permission);
//     console.log('requestLocationPermissions', requestResult);

//     if (requestResult === RESULTS.GRANTED) {
//       await checkLocationAvailability();
//       return true;
//     }

//     if (requestResult === RESULTS.BLOCKED) {
//       console.log('Location permission blocked after request');
//       showLocationSettingsAlert();
//       return false;
//     }

//     console.log('User denied location permission, requesting again...');
//   }
// };

const showLocationSettingsAlert = () => {
  Alert.alert(
    'Location Permission Required',
    'Please enable location access to continue.',
    [
      {
        text: 'Open Settings',
        onPress: () => {
          openSettings();
        },
      },
    ],
    { cancelable: false },
  );
};

export const requestCameraPermission = async () => {
  const permissionType = Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  });

  const msg = 'Please enable Camera permission in your app settings.';

  try {
    const result = await check(permissionType!);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    if (result === RESULTS.DENIED) {
      const requestResult = await request(permissionType!);
      if (requestResult === RESULTS.GRANTED) {
        return true;
      } else if (requestResult === RESULTS.BLOCKED) {
        openSetting(msg);
        return false;
      } else {
        return false;
      }
    }

    if (result === RESULTS.BLOCKED) {
      openSetting(msg);
      return false;
    }

    return false;
  } catch (error) {
    console.error('Error checking/requesting camera permission:', error);
    return false;
  }
};

export const requestCallPermissions = async () => {
  const camera = await requestCameraPermission();
  const mic = await requestMicrophonePermission();
  return camera && mic;
};
