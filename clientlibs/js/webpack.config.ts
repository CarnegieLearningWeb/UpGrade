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

const browser = {
  ...generalConfiguration,
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/browser'),
    library: 'UpgradeClient',
    libraryExport: 'default',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  plugins: [
    new webpack.DefinePlugin({
      API_VERSION: version,
      USE_CUSTOM_HTTP_CLIENT: JSON.stringify(false),
      IS_BROWSER: JSON.stringify(true),
    }),
  ],
};

const node = {
  ...generalConfiguration,
  target: 'node',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/node'),
    libraryTarget: 'umd',
    library: 'upgrade-client-lib',
  },
  plugins: [
    new webpack.DefinePlugin({
      API_VERSION: version,
      USE_CUSTOM_HTTP_CLIENT: JSON.stringify(false),
      IS_BROWSER: JSON.stringify(false),
    }),
  ],
};

const browserLite = {
  ...generalConfiguration,
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/browser-lite'),
    libraryTarget: 'umd',
    library: 'upgrade-client-lib',
  },
  externals: {
    axios: 'axios',
  },
  plugins: [
    new webpack.DefinePlugin({
      API_VERSION: version,
      USE_CUSTOM_HTTP_CLIENT: JSON.stringify(true),
      IS_BROWSER: JSON.stringify(true),
    }),
  ],
};

const nodeLite = {
  ...generalConfiguration,
  target: 'node',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/node-lite'),
    libraryTarget: 'umd',
    library: 'upgrade-client-lib',
  },
  externals: {
    axios: 'axios',
  },
  plugins: [
    new webpack.DefinePlugin({
      API_VERSION: version,
      USE_CUSTOM_HTTP_CLIENT: JSON.stringify(true),
      IS_BROWSER: JSON.stringify(false),
    }),
  ],
};

module.exports = [browser, node, browserLite, nodeLite];
