jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);
jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  types: { images: 'image/*', pdf: 'application/pdf' },
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: error => typeof error?.code === 'string',
}));
jest.mock('react-native-modal-datetime-picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockDateTimePicker(props) {
    return React.createElement(View, props);
  };
});
jest.mock('@/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
require('react-native-gesture-handler/jestSetup');
jest.mock('@/utils/fontIcon.utils', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = props => React.createElement(View, props);
  return {
    Ionicons: Icon,
    Feather: Icon,
    AntDesign: Icon,
    Entypo: Icon,
    Fontisto: Icon,
    MaterialIcons: Icon,
    MaterialDesignIcons: Icon,
  };
});
jest.mock('react-native-linear-gradient', () => {
  const { View } = require('react-native');
  return View;
});
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      fitToCoordinates: jest.fn(), animateToRegion: jest.fn(),
    }));
    return React.createElement(View, props);
  });
  return { __esModule: true, default: MapView, Marker: View, Polyline: View, PROVIDER_GOOGLE: 'google' };
});
