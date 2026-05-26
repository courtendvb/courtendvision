const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const tsRule = {
  test: /\.ts$/,
  use: 'ts-loader',
  exclude: /node_modules/,
};

const resolve = { extensions: ['.ts', '.js'] };

const mainConfig = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-main',
  entry: './src/main/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'main.js',
  },
  module: { rules: [tsRule] },
  resolve,
  node: { __dirname: false, __filename: false },
};

const preloadConfig = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-preload',
  entry: './src/preload/preload.ts',
  output: {
    path: path.resolve(__dirname, 'dist/preload'),
    filename: 'preload.js',
  },
  module: { rules: [tsRule] },
  resolve,
};

const overlayConfig = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-renderer',
  entry: './src/renderer/overlay/overlay.ts',
  output: {
    path: path.resolve(__dirname, 'dist/renderer/overlay'),
    filename: 'overlay.js',
  },
  module: { rules: [tsRule] },
  resolve,
  plugins: [
    new CopyPlugin({
      patterns: [{ from: 'src/renderer/overlay/overlay.html' }],
    }),
  ],
};

const settingsConfig = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-renderer',
  entry: './src/renderer/settings/settings.ts',
  output: {
    path: path.resolve(__dirname, 'dist/renderer/settings'),
    filename: 'settings.js',
  },
  module: { rules: [tsRule] },
  resolve,
  plugins: [
    new CopyPlugin({
      patterns: [{ from: 'src/renderer/settings/settings.html' }],
    }),
  ],
};

module.exports = [mainConfig, preloadConfig, overlayConfig, settingsConfig];
