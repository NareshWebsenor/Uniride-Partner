const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const customConfig = {
  resolver: {
    extraNodeModules: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  const mergedConfig = mergeConfig(defaultConfig, {
    maxWorkers: 2,
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
      extraNodeModules: customConfig.resolver.extraNodeModules,
    },
  });

  return wrapWithReanimatedMetroConfig(mergedConfig);
})();
