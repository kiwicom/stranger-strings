const path = require("path")
const nodeExternals = require("webpack-node-externals")

module.exports = {
  mode: "development",
  target: "node",
  entry: ["@babel/polyfill", "./index.js"],
  externals: [nodeExternals()],
  devtool: "source-map",
  output: {
    path: `${__dirname}/dist/`,
    filename: "index.js",
    library: "",
    libraryTarget: "commonjs",
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "eslint-loader",
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/env",
            ],
          },
        },
      },
    ],
  },
}
