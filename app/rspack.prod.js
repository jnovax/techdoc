const common = require('./rspack.common.js')
const htmlexport = require('./rspack.htmlexport.js')
const { merge } = require('webpack-merge')
const path = require('path')
const rspack = require('@rspack/core')

module.exports = [
  merge(common, {
    mode: 'production',
    output: {
      path: path.join(__dirname, 'public/build'),
      publicPath: 'build/',
      filename: '[name].[contenthash:10].js',
      cssFilename: '[name].[contenthash:10].css'
    },
    optimization: {
      minimizer: [
        new rspack.SwcJsMinimizerRspackPlugin({
          format: {
            comments: false
          }
        }),
        new rspack.LightningCssMinimizerRspackPlugin()
      ],
      splitChunks: {
        chunks: 'all'
      }
    },
    devtool: 'source-map'
  }),
  merge(htmlexport, {
    mode: 'production',
    optimization: {
      minimizer: [
        new rspack.SwcJsMinimizerRspackPlugin(),
        new rspack.LightningCssMinimizerRspackPlugin()
      ]
    }
  })
]
