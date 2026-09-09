'use strict'
const assert = require('assert')
const fs = require('fs')
const path = require('path')

function runTests () {
  const commonPath = path.join(__dirname, '../rspack.common.js')
  const prodPath = path.join(__dirname, '../rspack.prod.js')
  const devPath = path.join(__dirname, '../rspack.dev.js')
  const htmlexportPath = path.join(__dirname, '../rspack.htmlexport.js')
  const buildScriptPath = path.join(__dirname, '../scripts/build-assets.sh')

  // Test 1: Files exist
  assert.ok(fs.existsSync(commonPath), 'rspack.common.js must exist')
  assert.ok(fs.existsSync(prodPath), 'rspack.prod.js must exist')
  assert.ok(fs.existsSync(devPath), 'rspack.dev.js must exist')
  assert.ok(fs.existsSync(htmlexportPath), 'rspack.htmlexport.js must exist')
  assert.ok(fs.existsSync(buildScriptPath), 'scripts/build-assets.sh must exist')

  // Test 2: rspack.common.js rules & SWC / LightningCSS configuration
  const commonContent = fs.readFileSync(commonPath, 'utf8')
  assert.ok(commonContent.includes('CssExtractRspackPlugin'), 'rspack.common.js must use CssExtractRspackPlugin for CSS extraction and font path resolution')
  assert.ok(commonContent.includes("loader: 'builtin:swc-loader'"), 'rspack.common.js must use builtin:swc-loader')
  assert.ok(commonContent.includes("target: 'es2020'"), 'SWC target must be es2020 for modern evergreen browsers')
  assert.ok(!commonContent.includes('babel-polyfill'), 'rspack.common.js must NOT include legacy babel-polyfill')
  assert.ok(!commonContent.includes('crypto.createHash'), 'rspack.common.js must NOT require crypto monkey-patching')
  assert.ok(commonContent.includes('HtmlRspackPlugin'), 'rspack.common.js must use HtmlRspackPlugin')
  assert.ok(commonContent.includes('rspack.CopyRspackPlugin'), 'rspack.common.js must use CopyRspackPlugin')
  assert.ok(commonContent.includes('rspack.ProvidePlugin'), 'rspack.common.js must use ProvidePlugin')

  // Test 3: rspack.prod.js minifiers
  const prodContent = fs.readFileSync(prodPath, 'utf8')
  assert.ok(prodContent.includes('LightningCssMinimizerRspackPlugin'), 'rspack.prod.js must configure LightningCssMinimizerRspackPlugin')
  assert.ok(prodContent.includes('SwcJsMinimizerRspackPlugin'), 'rspack.prod.js must configure SwcJsMinimizerRspackPlugin')
  assert.ok(prodContent.includes('[name].[contenthash:10].js'), 'rspack.prod.js must use contenthash for JavaScript')
  assert.ok(prodContent.includes('[name].[contenthash:10].css'), 'rspack.prod.js must use contenthash for CSS')

  // Test 4: EJS partials integrity in public/views/build
  const viewsBuildDir = path.join(__dirname, '../public/views/build')
  const expectedPartials = [
    'index-pack-header.ejs',
    'index-pack-scripts.ejs',
    'cover-pack-header.ejs',
    'cover-pack-scripts.ejs',
    'pretty-pack-header.ejs',
    'pretty-pack-scripts.ejs',
    'slide-pack-header.ejs',
    'slide-pack-scripts.ejs'
  ]

  for (const partial of expectedPartials) {
    const partialPath = path.join(viewsBuildDir, partial)
    assert.ok(fs.existsSync(partialPath), `EJS partial ${partial} must exist`)
    const content = fs.readFileSync(partialPath, 'utf8')
    assert.ok(content.length > 0, `EJS partial ${partial} must not be empty`)
    if (partial.endsWith('-header.ejs')) {
      assert.ok(content.includes('<link href="'), `${partial} must contain <link href=" tags`)
    } else if (partial.endsWith('-scripts.ejs')) {
      assert.ok(content.includes('<script src="'), `${partial} must contain <script src=" tags`)
    }
  }

  // Test 5: package.json script references
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
  assert.ok(pkg.scripts.build.includes('rspack build --config rspack.prod.js'), 'npm run build must invoke rspack')
  assert.ok(pkg.scripts.dev.includes('rspack build --config rspack.dev.js'), 'npm run dev must invoke rspack')
  assert.ok(pkg.devDependencies['@rspack/core'], '@rspack/core must be in devDependencies')
  assert.ok(pkg.devDependencies['@rspack/cli'], '@rspack/cli must be in devDependencies')

  console.log('All Rspack, SWC, and LightningCSS configuration & bundle tests passed successfully!')
}

if (typeof describe !== 'undefined') {
  describe('Modernized Build Infrastructure (Rspack + SWC + LightningCSS)', function () {
    it('should satisfy all Rspack config, SWC, LightningCSS, and partial specs', function () {
      runTests()
    })
  })
} else {
  runTests()
}
