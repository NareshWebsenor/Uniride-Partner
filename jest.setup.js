jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
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
