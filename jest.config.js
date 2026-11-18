module.exports = {
  preset: 'react-native',
  transform: {
    ...require('react-native/jest-preset').transform,
    '^.+\\.wav$': require.resolve('react-native/jest/assetFileTransformer'),
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native[^/]*|@react-navigation)/)',
  ],
};
