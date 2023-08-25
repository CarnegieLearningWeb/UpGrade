import path = require('path');
import webpack = require('webpack');

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
};

const browser = {
  ...generalConfiguration,
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/browser'),
    libraryTarget: 'umd',
    library: 'upgrade-client-lib',
  },
  plugins: [
    new webpack.DefinePlugin({
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
      USE_CUSTOM_HTTP_CLIENT: JSON.stringify(true),
      IS_BROWSER: JSON.stringify(false),
    }),
  ],
};

module.exports = [browser, node, browserLite, nodeLite];
