'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runTests() {
  const cssPath = path.join(__dirname, '../public/css/docusaurus-theme.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Test 1: Layout wrapper max-width (1360px with generous 48px padding)
  assert.ok(css.includes('.docusaurus-layout-wrapper'), 'CSS should define .docusaurus-layout-wrapper');
  assert.ok(css.includes('max-width: 1360px'), 'Layout wrapper should have comfortable max-width of 1360px');
  assert.ok(css.includes('padding: 40px 48px 96px'), 'Layout wrapper should have generous 48px horizontal padding');

  // Test 2: Navbar horizontal padding matches content padding
  assert.ok(css.includes('padding: 0 48px'), 'Navbar should have 48px horizontal padding');

  // Test 3: Document Hero Header
  assert.ok(css.includes('.doc-hero-header'), 'CSS should define .doc-hero-header');
  assert.ok(css.includes('.doc-hero-title'), 'CSS should define .doc-hero-title');
  assert.ok(css.includes('.doc-hero-meta'), 'CSS should define .doc-hero-meta');

  // Test 4: Flat button rules
  assert.ok(css.includes('.docusaurus-flat-btn'), 'CSS should define .docusaurus-flat-btn');
  assert.ok(css.includes('box-shadow: none !important'), 'Flat buttons should remove box-shadow');

  // Test 5: Redundant padding removal
  assert.ok(css.includes('padding-top: 0 !important'), 'Markdown body padding-top should be reset to 0');
  assert.ok(css.includes('padding-bottom: 0 !important'), 'Markdown body padding-bottom should be reset to 0');

  // Test 6: pretty.ejs template structure
  const prettyPath = path.join(__dirname, '../public/views/pretty.ejs');
  const prettyHtml = fs.readFileSync(prettyPath, 'utf8');
  assert.ok(!prettyHtml.includes('id="docusaurusLeftSidebar"'), 'pretty.ejs should NOT include left sidebar');
  assert.ok(!prettyHtml.includes('id="sidebarToggleBtn"'), 'pretty.ejs should NOT include sidebar toggle button');
  assert.ok(prettyHtml.includes('class="doc-hero-header"'), 'pretty.ejs should include .doc-hero-header');
  assert.ok(prettyHtml.includes('docusaurus-flat-btn'), 'pretty.ejs should use docusaurus-flat-btn');

  // Test 7: Consistent Navbar Brand & Logo with Dashboard
  assert.ok(prettyHtml.includes('banner/banner_vertical_color.svg'), 'pretty.ejs should use banner_vertical_color.svg like dashboard');
  assert.ok(prettyHtml.includes('portal-brand'), 'pretty.ejs should use portal-brand class');
  assert.ok(css.includes('font-size: 19px'), 'docusaurus-navbar-brand should use 19px font-size');
  assert.ok(css.includes('height: 34px'), 'docusaurus-navbar-brand img should use height 34px');

  console.log('All Balanced Widescreen Layout & Flat UI tests passed successfully!');
}

if (typeof describe !== 'undefined') {
  describe('Balanced Widescreen Layout & Flat UI', function () {
    it('should satisfy all layout, hero header, and flat button specifications', function () {
      runTests();
    });
  });
} else {
  runTests();
}
