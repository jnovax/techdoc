'use strict'
const assert = require('assert')
const fs = require('fs')
const path = require('path')

function runTests () {
  // Test 1: Check docusaurus-theme.css light and dark tokens
  const cssPath = path.join(__dirname, '../public/css/docusaurus-theme.css')
  assert.ok(fs.existsSync(cssPath), 'docusaurus-theme.css must exist')
  const css = fs.readFileSync(cssPath, 'utf8')

  assert.ok(css.includes("[data-theme='light']"), 'docusaurus-theme.css must support data-theme=light')
  assert.ok(css.includes("[data-theme='dark']"), 'docusaurus-theme.css must support data-theme=dark')
  assert.ok(css.includes('body.night'), 'docusaurus-theme.css must support body.night')

  // Validate Docusaurus dark palette values
  assert.ok(css.includes('#18191a'), 'Dark theme must define #18191a background color')
  assert.ok(css.includes('#242526'), 'Dark theme must define #242526 surface background color')
  assert.ok(css.includes('#e3e3e3'), 'Dark theme must define #e3e3e3 readable text color')
  assert.ok(css.includes('#38bdf8'), 'Dark theme must define #38bdf8 primary vibrant accent color')
  assert.ok(css.includes('#2e3035'), 'Dark theme must define #2e3035 border color')
  assert.ok(css.includes('.docusaurus-theme-toggle'), 'docusaurus-theme.css must define .docusaurus-theme-toggle')

  // Test 2: Check theme toggle in pretty.ejs
  const prettyPath = path.join(__dirname, '../public/views/pretty.ejs')
  const prettyHtml = fs.readFileSync(prettyPath, 'utf8')
  assert.ok(prettyHtml.includes('id="docusaurusThemeToggle"'), 'pretty.ejs must include docusaurusThemeToggle')
  assert.ok(prettyHtml.includes('theme-switcher.js'), 'pretty.ejs must include theme-switcher.js')
  assert.ok(prettyHtml.includes('data-theme'), 'pretty.ejs must include early theme detection')

  // Test 3: Check theme toggle in portal (index/body.ejs)
  const bodyPath = path.join(__dirname, '../public/views/index/body.ejs')
  const bodyHtml = fs.readFileSync(bodyPath, 'utf8')
  assert.ok(bodyHtml.includes('id="portalThemeToggle"'), 'index/body.ejs must include portalThemeToggle')

  // Test 4: Check portal.css dark mode rules
  const portalCssPath = path.join(__dirname, '../public/css/portal.css')
  const portalCss = fs.readFileSync(portalCssPath, 'utf8')
  assert.ok(portalCss.includes("[data-theme='dark']"), 'portal.css must support data-theme=dark')
  assert.ok(portalCss.includes('#18191a'), 'portal.css dark mode must use #18191a')
  assert.ok(portalCss.includes('#242526'), 'portal.css dark mode must use #242526')

  // Test 5: Check inpage-search.css dark mode rules
  const searchCssPath = path.join(__dirname, '../public/css/inpage-search.css')
  const searchCss = fs.readFileSync(searchCssPath, 'utf8')
  assert.ok(searchCss.includes("[data-theme='dark'] .techdoc-navbar-search"), 'inpage-search.css must support dark navbar search')

  // Test 6: Check index.css night styles
  const indexCssPath = path.join(__dirname, '../public/css/index.css')
  const indexCss = fs.readFileSync(indexCssPath, 'utf8')
  assert.ok(indexCss.includes('#18191a'), 'index.css night mode must use #18191a')
  assert.ok(indexCss.includes('#242526'), 'index.css night mode must use #242526')

  // Test 7: Check theme-switcher.js
  const switcherPath = path.join(__dirname, '../public/js/theme-switcher.js')
  assert.ok(fs.existsSync(switcherPath), 'theme-switcher.js must exist')
  const switcherJs = fs.readFileSync(switcherPath, 'utf8')
  assert.ok(switcherJs.includes('TechDocTheme'), 'theme-switcher.js must expose TechDocTheme')
  assert.ok(switcherJs.includes('banner_h_wb.svg'), 'theme-switcher.js must support dark banner swap')

  // Test 8: Check Diagram Styles in Light and Dark mode (Unified clean white card)
  assert.ok(css.includes('pre:not(.mermaid):not(.sequence-diagram):not(.flow-chart):not(.graphviz):not(.abc)'), 'Code block background must exclude diagrams')
  assert.ok(css.includes('background-color: #ffffff !important'), 'Diagrams must have clean #ffffff card in Light & Dark Mode')
  assert.ok(css.includes("[data-theme='dark'] .graphviz"), 'Dark mode must style graphviz container')
  assert.ok(css.includes("[data-theme='dark'] .abc"), 'Dark mode must style abc container')
  assert.ok(css.includes("[data-theme='dark'] .abc svg"), 'Dark mode must style abc svg with filter: none')
  assert.ok(css.includes('.graphviz svg > g > polygon:first-child'), 'Graphviz canvas polygon must be styled cleanly')

  // Test 9: Ensure markdown.css no longer sets .night pre rect transparent or pre invert
  const markdownCssPath = path.join(__dirname, '../public/css/markdown.css')
  const markdownCss = fs.readFileSync(markdownCssPath, 'utf8')
  assert.ok(!markdownCss.includes('.night pre rect'), 'markdown.css must not make .night pre rect transparent')
  assert.ok(!markdownCss.includes('.night .markdown-body pre {'), 'markdown.css must not invert pre blocks in night mode')

  // Test 10: Check extra.js mermaid theme initialization
  const extraJsPath = path.join(__dirname, '../public/js/extra.js')
  const extraJs = fs.readFileSync(extraJsPath, 'utf8')
  assert.ok(extraJs.includes("theme: 'default'"), "extra.js must initialize mermaid with theme: 'default'")

  // Test 12: Check CSP nonces on inline scripts in views
  const prettyContent = fs.readFileSync(path.join(__dirname, '../public/views/pretty.ejs'), 'utf8')
  assert.ok(prettyContent.includes('<script nonce="<%- cspNonce %>">'), 'pretty.ejs must have nonce on inline script')
  const indexHeadContent = fs.readFileSync(path.join(__dirname, '../public/views/index/head.ejs'), 'utf8')
  assert.ok(indexHeadContent.includes('<script nonce="<%- cspNonce %>">'), 'index/head.ejs must have nonce on inline script')
  const techdocHeadContent = fs.readFileSync(path.join(__dirname, '../public/views/techdoc/head.ejs'), 'utf8')
  assert.ok(techdocHeadContent.includes('<script nonce="<%- cspNonce %>">'), 'techdoc/head.ejs must have nonce on inline script')
  const cspJsContent = fs.readFileSync(path.join(__dirname, '../lib/csp.js'), 'utf8')
  assert.ok(cspJsContent.includes('res.locals.cspNonce = res.locals.nonce'), 'csp.js must set res.locals.cspNonce')

  // Test 13: Check docker-compose and nginx configs
  const composeContent = fs.readFileSync(path.join(__dirname, '../../docker-compose.yml'), 'utf8')
  assert.ok(!composeContent.includes('techdoc_static'), 'docker-compose.yml must not use stale techdoc_static named volume')
  const nginxConfContent = fs.readFileSync(path.join(__dirname, '../../nginx/default.conf'), 'utf8')
  assert.ok(nginxConfContent.includes('try_files $uri @node_app;'), 'nginx/default.conf must fallback to @node_app for static assets')

  // Test 14: Check Alert Area Callout & Emoji isolation styles
  assert.ok(css.includes('.alert-success'), 'docusaurus-theme.css must style alert-success')
  assert.ok(css.includes('.alert-info'), 'docusaurus-theme.css must style alert-info')
  assert.ok(css.includes('.alert-warning'), 'docusaurus-theme.css must style alert-warning')
  assert.ok(css.includes('.alert-danger'), 'docusaurus-theme.css must style alert-danger')
  assert.ok(css.includes("[data-theme='dark'] .alert-success"), 'docusaurus-theme.css must style dark alert-success')
  assert.ok(css.includes('#doc.markdown-body img:not(.emoji)'), 'docusaurus-theme.css must not apply image box-shadow to emojis')
  assert.ok(css.includes('#doc.markdown-body img.emoji'), 'docusaurus-theme.css must have dedicated img.emoji styling')

  // Test 15: Check renderContainer in extra.js and syncscroll.js handles closing tags cleanly
  assert.ok(extraJs.includes('if (tokens[idx].nesting === 1)'), 'extra.js renderContainer must only add attributes to open tags')
  const syncscrollJs = fs.readFileSync(path.join(__dirname, '../public/js/lib/syncscroll.js'), 'utf8')
  assert.ok(syncscrollJs.includes('if (tokens[idx].nesting === 1)'), 'syncscroll.js renderContainer must only add attributes to open tags')

  // Test 16: Check Unified Docusaurus Theme Toggle Icon across all views
  const techdocHeader = fs.readFileSync(path.join(__dirname, '../public/views/techdoc/header.ejs'), 'utf8')
  assert.ok(techdocHeader.includes('id="editorThemeToggle"'), 'techdoc/header.ejs must have editorThemeToggle')
  assert.ok(techdocHeader.includes('id="editorThemeToggleMobile"'), 'techdoc/header.ejs must have editorThemeToggleMobile')
  assert.ok(techdocHeader.includes('docusaurus-theme-toggle'), 'techdoc/header.ejs must use docusaurus-theme-toggle class')
  assert.ok(techdocHeader.includes('theme-icon-light') && techdocHeader.includes('theme-icon-dark'), 'techdoc/header.ejs must use dual-icon pattern')

  const loginView = fs.readFileSync(path.join(__dirname, '../public/views/login.ejs'), 'utf8')
  assert.ok(loginView.includes('id="loginThemeToggle"'), 'login.ejs must have loginThemeToggle')
  assert.ok(loginView.includes('theme-icon-light') && loginView.includes('theme-icon-dark'), 'login.ejs must use dual-icon pattern')

  assert.ok(prettyHtml.includes('theme-icon-light') && prettyHtml.includes('theme-icon-dark'), 'pretty.ejs must use dual-icon pattern')
  assert.ok(bodyHtml.includes('theme-icon-light') && bodyHtml.includes('theme-icon-dark'), 'index/body.ejs must use dual-icon pattern')
  assert.ok(css.includes('#f59e0b'), 'docusaurus-theme.css must define glowing amber color for dark mode sun icon')

  console.log('All Docusaurus Dark/Light Theme, Diagram & CSP Nonce tests passed successfully!')
}

if (typeof describe !== 'undefined') {
  describe('Docusaurus Dark/Light Theme System', function () {
    it('should validate all light and dark tokens, theme toggles, and styles', function () {
      runTests()
    })
  })
} else {
  runTests()
}
