import path = require('path');
import webpack = require('webpack');
import packageJson = require('./package.json');

const version = packageJson.version.split('.')[0];
const clientVersion = JSON.stringify(packageJson.version);

const generalConfiguration = {
  mode: 'production',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [/node_modules/, /\.spec.ts$/],
      },
    ],
  },
  resolve: {
    alias: {
      upgrade_types: path.resolve(__dirname, '../../packages/types/src'),
      // packages/types is outside this package's node_modules, so its own
      // tslib resolves from the repo-root install while files under src/
      // resolve tslib from this package's local install. Force both to the
      // same physical module so webpack doesn't bundle it twice.
      tslib: path.resolve(__dirname, 'node_modules/tslib'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      API_VERSION: version,
      CLIENT_VERSION: clientVersion,
    }),
  ],
};

const createConfig = (target: string, outputPath: string, useCustomHttpClient: boolean, externals = {}) => ({
  ...generalConfiguration,
  target,
  output: {
    library: 'UpgradeClient',
    globalObject: 'this',
    libraryTarget: 'umd',
    libraryExport: 'default',
    filename: 'index.js',
    path: path.resolve(__dirname, outputPath),
  },
  externals,
  plugins: [
    new webpack.DefinePlugin({
      API_VERSION: version,
      CLIENT_VERSION: clientVersion,
      USE_CUSTOM_HTTP_CLIENT: JSON.stringify(useCustomHttpClient),
    }),
  ],
});

module.exports = [
  createConfig(undefined, 'dist/browser', false),
  createConfig('node', 'dist/node', false),
  createConfig(undefined, 'dist/lite', true),
];
