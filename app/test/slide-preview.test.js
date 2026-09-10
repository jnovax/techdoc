'use strict'
const assert = require('assert')
const fs = require('fs')
const path = require('path')

function runTests () {
  // Test 1: Verify slide-preview.css does not leak 50vw box-shadow
  const cssPath = path.join(__dirname, '../public/css/slide-preview.css')
  assert.ok(fs.existsSync(cssPath), 'slide-preview.css must exist')
  const css = fs.readFileSync(cssPath, 'utf8')

  assert.ok(!css.includes('50vw'), 'slide-preview.css must not contain 50vw box-shadow leak')
  assert.ok(!css.includes('padding-bottom: 56.23%'), 'slide-preview.css must not use padding-bottom 56.23% hack')

  // Test 2: Verify aspect-ratio 16 / 9 and no overflow clipping
  assert.ok(css.includes('aspect-ratio: 16 / 9'), 'slide-preview.css must define aspect-ratio: 16 / 9 for modern cards')
  assert.ok(css.includes('max-height: none !important'), 'slide-preview.css must not truncate slide content with max-height')

  // Test 3: Verify light mode styling
  assert.ok(css.includes('.markdown-body.slides section[data-markdown]'), 'slide cards must be styled')
  assert.ok(css.includes('border-bottom: none !important'), 'slide headings must remove bottom border')

  // Test 4: Verify dark mode styling and contrast
  assert.ok(css.includes("html[data-theme='dark'] .markdown-body.slides section[data-markdown]"), 'slide cards must support dark mode')
  assert.ok(css.includes('#242526'), 'dark mode slide card must use dark surface')
  assert.ok(css.includes('#f8fafc'), 'dark mode slide headings must use high contrast light color')
  assert.ok(css.includes('#cbd5e1'), 'dark mode slide text must use readable light slate')

  // Test 5: Verify fragments in preview mode are visible
  assert.ok(css.includes('.markdown-body.slides .fragment'), 'slide fragments must be handled in preview mode')
  assert.ok(css.includes('opacity: 1 !important'), 'slide fragments must be visible in preview mode')

  // Test 6: Verify presentation button in pretty.ejs
  const prettyPath = path.join(__dirname, '../public/views/pretty.ejs')
  const prettyHtml = fs.readFileSync(prettyPath, 'utf8')
  assert.ok(prettyHtml.includes('id="techdocSlideBtn"'), 'pretty.ejs must include techdocSlideBtn')
  assert.ok(prettyHtml.includes('Trình chiếu'), 'pretty.ejs must label slide button as Trình chiếu')
  assert.ok(prettyHtml.includes('/p/<%- noteId %>'), 'pretty.ejs slide button must link to /p/<noteId>')

  // Test 7: Verify pretty.js handles slide button and TOC
  const prettyJsPath = path.join(__dirname, '../public/js/pretty.js')
  const prettyJs = fs.readFileSync(prettyJsPath, 'utf8')
  assert.ok(prettyJs.includes("$('#techdocSlideBtn').removeClass('hidden')"), 'pretty.js must reveal slide button for slide type')
  assert.ok(prettyJs.includes("$('#docusaurusToc').hide()"), 'pretty.js must hide TOC for slide type')

  // Test 8: Verify docusaurus-theme.css full-width support for slides
  const docuCssPath = path.join(__dirname, '../public/css/docusaurus-theme.css')
  const docuCss = fs.readFileSync(docuCssPath, 'utf8')
  assert.ok(docuCss.includes('#doc.slides'), 'docusaurus-theme.css must support full-width slides layout')

  // Test 9: Verify rspack includes 'common' chunk in slide-pack-scripts.ejs
  const rspackCommonPath = path.join(__dirname, '../rspack.common.js')
  const rspackCommon = fs.readFileSync(rspackCommonPath, 'utf8')
  assert.ok(rspackCommon.includes("chunks: ['common', 'slide-pack']"), 'rspack.common.js must include common chunk for slide-pack to define $')

  // Test 10: Verify frontmatter stripping in index.js, pretty.js, slide.js
  const indexJsPath = path.join(__dirname, '../public/js/index.js')
  const indexJs = fs.readFileSync(indexJsPath, 'utf8')
  assert.ok(indexJs.includes("rawVal.replace(/^\\s*---[\\s\\S]*?---\\s*(\\r\\n?|\\n)/, '')"), 'index.js must strip frontmatter before slidify')

  const slideJsPath = path.join(__dirname, '../public/js/slide.js')
  const slideJs = fs.readFileSync(slideJsPath, 'utf8')
  assert.ok(slideJs.includes("body.replace(/^\\s*---[\\s\\S]*?---\\s*(\\r\\n?|\\n)/, '')"), 'slide.js must strip frontmatter before slidify')

  // Test 11: Verify centered specificity in slide-preview.css
  assert.ok(css.includes('#doc.markdown-body.slides section[data-markdown]'), 'slide-preview.css must have #doc.markdown-body.slides specificity')
  assert.ok(css.includes('.ui-view-area:has(#doc.slides) .ui-infobar'), 'slide-preview.css must center infobar in slide view mode')

  // Test 12: Verify Note.parseMeta preserves meta.type
  const noteModelPath = path.join(__dirname, '../lib/models/note.js')
  const noteModel = fs.readFileSync(noteModelPath, 'utf8')
  assert.ok(noteModel.includes('_meta.type = meta.type'), 'Note.parseMeta must preserve meta.type')

  // Test 13: Verify util.getPublishData includes isSlide
  const utilPath = path.join(__dirname, '../lib/web/note/util.js')
  const utilCode = fs.readFileSync(utilPath, 'utf8')
  assert.ok(utilCode.includes("isSlide: Boolean(extracted.meta && extracted.meta.type === 'slide')"), 'util.js must calculate isSlide')

  // Test 14: Verify slide.js & controller.js redirect non-slide notes to /s/:shortid
  const slideBackendPath = path.join(__dirname, '../lib/web/note/slide.js')
  const slideBackend = fs.readFileSync(slideBackendPath, 'utf8')
  assert.ok(slideBackend.includes('if (!data.isSlide)'), 'slide.js showPublishSlide must check !data.isSlide')

  const controllerPath = path.join(__dirname, '../lib/web/note/controller.js')
  const controllerCode = fs.readFileSync(controllerPath, 'utf8')
  assert.ok(controllerCode.includes("extracted.meta.type === 'slide'"), 'controller.js doAction must verify slide type before redirecting to /p/')

  // Test 15: Verify header.ejs and pretty.ejs hide slide options on normal notes
  const headerPath = path.join(__dirname, '../public/views/techdoc/header.ejs')
  const headerHtml = fs.readFileSync(headerPath, 'utf8')
  assert.ok(headerHtml.includes('class="ui-extra-slide-item hidden"'), 'header.ejs must hide Slide Mode in menu by default')
  assert.ok(prettyHtml.includes('typeof isSlide !== \'undefined\' && isSlide'), 'pretty.ejs must conditionally render slide button only when isSlide')

  console.log('All Slide Preview, Deck Cards & Dark/Light Mode tests passed successfully!')
}

runTests()
