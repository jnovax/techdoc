const rspack = require('@rspack/core')
const path = require('path')

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
    new rspack.HtmlRspackPlugin({
      template: 'public/views/htmlexport.ejs',
      filename: 'htmlexport.html',
      inject: false
    })
  ]
}
