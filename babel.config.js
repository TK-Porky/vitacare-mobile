module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'react-native-iconify/babel',
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
