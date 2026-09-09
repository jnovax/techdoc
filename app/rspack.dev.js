const common = require('./rspack.common.js')
const htmlexport = require('./rspack.htmlexport.js')
const { merge } = require('webpack-merge')

module.exports = [
  merge(common, {
    mode: 'development',
    devtool: 'cheap-module-source-map'
  }),
  merge(htmlexport, {
    mode: 'development',
    devtool: 'cheap-module-source-map'
  })
]
