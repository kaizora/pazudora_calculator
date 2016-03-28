const path = require('path');
const webpack = require('webpack');

const config = {
  entry: ['./app/js/main.js'],
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, './public/js'),
    publicPath: '/public/js'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    })
  ],
  resolve: {
    extensions: ['', '.js'],
    modulesDirectories: ['src', 'node_modules']
  }
};

module.exports = config;
