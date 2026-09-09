const rspack = require('@rspack/core')
const HtmlRspackPlugin = require('html-rspack-plugin')
const path = require('path')
const _ = require('lodash')

module.exports = {
  name: 'save-as-html',
  entry: {
    htmlExport: path.join(__dirname, 'public/js/htmlExport.js')
  },
  experiments: {
    css: true
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        type: 'css'
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset'
      }
    ]
  },
  output: {
    path: path.join(__dirname, 'public/build'),
    publicPath: 'build/',
    filename: '[name].js'
  },
  plugins: [
    new HtmlRspackPlugin({
      template: 'public/views/htmlexport.ejs',
      filename: 'htmlexport.html',
      inject: false,
      templateParameters: (compilation, assets, assetTags, options) => ({
        compilation,
        webpackConfig: compilation.options,
        htmlWebpackPlugin: {
          tags: assetTags,
          files: assets,
          options
        },
        _
      })
    })
  ]
}
