import path = require('path');
import webpack = require('webpack');
import packageJson = require('./package.json');

const version = packageJson.version.split('.')[0];

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
      upgrade_types: path.resolve(__dirname, '../../types/src'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      API_VERSION: version,
    }),
  ],
};

const createConfig = (
  target: string,
  outputPath: string,
  useCustomHttpClient: boolean,
  isBrowser: boolean,
  externals = {}
) => ({
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
      USE_CUSTOM_HTTP_CLIENT: JSON.stringify(useCustomHttpClient),
      IS_BROWSER: JSON.stringify(isBrowser),
    }),
  ],
});

module.exports = [
  createConfig(undefined, 'dist/browser', false, true),
  createConfig('node', 'dist/node', false, false),
  createConfig(undefined, 'dist/browser-lite', true, true, { axios: 'axios' }),
  createConfig('node', 'dist/node-lite', true, false, { axios: 'axios' }),
];
