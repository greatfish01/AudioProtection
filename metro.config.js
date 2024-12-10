const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver, // Ensure you preserve the default resolver configuration
    extraNodeModules: {
      ...defaultConfig.resolver?.extraNodeModules, // Merge existing extraNodeModules if any
      path: require.resolve('path-browserify'), // Add the 'path-browserify' polyfill
    },
  },
};
