const path = require('path');
// eslint-disable-next-line import/no-unresolved
const slsw = require('serverless-webpack');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: 'production',
  module: {
    rules: [{
      test: /\.js$/,
      use: 'babel-loader',
      include: __dirname,
      exclude: /node_modules/,
    }],
  },
  externals: ['aws-sdk'],
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
};
