const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    app: './app/scripts/app',
    dark: './app/dark',
    light: './app/light'
  },
  output: {
    filename: '[name].bundle.js',
    path: __dirname + '/dist'
  },
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, /app\/lib/],
        loader: 'eslint-loader'
      }
    ],
    loaders: [
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract("style", "css!less")
      },
      {
        test:/\.css$/,
        loader: 'style!css?-url'
      },
      {
        test: [/\.js$/],
        exclude: [/node_modules/, /app\/lib/],
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /src.*\.js$/,
        loaders: ['ng-annotate']
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin("styles/[name].css"),
    new CopyWebpackPlugin([
      {from: 'app/index.html'},
      {from: 'app/views/', to: 'views'},
      {from: 'app/images/', to: 'images'},
      {from: 'app/fonts/', to: 'fonts'},
      {from: 'app/lib/FlyControls.js', to: 'lib'},
    ]),
  ],
  devtool: ['source-map']
};
