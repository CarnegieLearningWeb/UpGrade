const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: [
          /node_modules/,
          /\.spec.ts$/
        ],
      },
    ],
  },
  resolve: {
    alias: {
      upgrade_types: path.resolve(__dirname, "../../types/src"),
    },
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "umd",
    library: "upgrade-client-lib",
  },
};
