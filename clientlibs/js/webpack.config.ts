const path = require("path");

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

module.exports = [browser, node];
