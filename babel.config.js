module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
    ],
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src', // adjust if your folder is different
          '@Assets': './assets',
          '@Components': './src/components',
          '@Context': './src/context',
          '@Interface': './src/interface',
          '@Localization': './src/localization',
          '@Navigation': './src/navigation',
          '@Screens': './src/screens',
          '@Service': './src/service',
          '@Store': './src/store',
          '@Utils': './src/utils',
        },
      },
    ],
    'react-native-worklets/plugin',
  ],
};
