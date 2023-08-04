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
  plugins: [
    new webpack.DefinePlugin({
      USE_CUSTOM_HTTP_CLIENT: JSON.stringify(false),
    }),
  ],
};

const liteConfiguration = {
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
      USE_CUSTOM_HTTP_CLIENT: JSON.stringify(true),
    }),
  ],
};

const httpClientConfiguration = {
  mode: 'production',
  entry: './src/defaultHttpClient.ts',
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
    libraryExport: 'default',
  },
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
};

const defaultHttpClient = {
  ...httpClientConfiguration,
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/defaultHttpClient'),
    libraryTarget: 'umd',
    library: 'upgrade-client-lib',
  },
};

const browserLite = {
  ...liteConfiguration,
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/browser-lite'),
    libraryTarget: 'umd',
    library: 'upgrade-client-lib',
  },
};

const nodeLite = {
  ...liteConfiguration,
  target: 'node',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/node-lite'),
    libraryTarget: 'umd',
    library: 'upgrade-client-lib',
  },
};

module.exports = [browser, node, defaultHttpClient, browserLite, nodeLite];
