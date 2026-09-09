'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runTests() {
  const cssPath = path.join(__dirname, '../public/css/docusaurus-theme.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Test 1: Layout wrapper widescreen max-width
  assert.ok(css.includes('.docusaurus-layout-wrapper'), 'CSS should define .docusaurus-layout-wrapper');
  assert.ok(css.includes('max-width: 1600px'), 'Layout wrapper should have widescreen max-width of 1600px');

  // Test 2: Left sidebar styles
  assert.ok(css.includes('.docusaurus-left-sidebar'), 'CSS should define .docusaurus-left-sidebar');
  assert.ok(css.includes('.docusaurus-left-sidebar.collapsed'), 'CSS should define .docusaurus-left-sidebar.collapsed');
  assert.ok(css.includes('margin-left: -280px'), 'Collapsed left sidebar should translate -280px');

  // Test 3: Document Hero Header
  assert.ok(css.includes('.doc-hero-header'), 'CSS should define .doc-hero-header');
  assert.ok(css.includes('.doc-hero-title'), 'CSS should define .doc-hero-title');
  assert.ok(css.includes('.doc-hero-meta'), 'CSS should define .doc-hero-meta');

  // Test 4: Flat button rules
  assert.ok(css.includes('.docusaurus-flat-btn'), 'CSS should define .docusaurus-flat-btn');
  assert.ok(css.includes('.docusaurus-sidebar-toggle'), 'CSS should define .docusaurus-sidebar-toggle');
  assert.ok(css.includes('box-shadow: none !important'), 'Flat buttons should remove box-shadow');

  // Test 5: Redundant padding removal
  assert.ok(css.includes('padding-top: 0 !important'), 'Markdown body padding-top should be reset to 0');
  assert.ok(css.includes('padding-bottom: 0 !important'), 'Markdown body padding-bottom should be reset to 0');

  // Test 6: pretty.ejs template structure
  const prettyPath = path.join(__dirname, '../public/views/pretty.ejs');
  const prettyHtml = fs.readFileSync(prettyPath, 'utf8');
  assert.ok(prettyHtml.includes('id="sidebarToggleBtn"'), 'pretty.ejs should include #sidebarToggleBtn');
  assert.ok(prettyHtml.includes('id="docusaurusLeftSidebar"'), 'pretty.ejs should include #docusaurusLeftSidebar');
  assert.ok(prettyHtml.includes('class="doc-hero-header"'), 'pretty.ejs should include .doc-hero-header');
  assert.ok(prettyHtml.includes('docusaurus-flat-btn'), 'pretty.ejs should use docusaurus-flat-btn');
  assert.ok(prettyHtml.includes('pretty-sidebar.js'), 'pretty.ejs should include pretty-sidebar.js');

  console.log('All Widescreen 3-Column Layout & Flat UI tests passed successfully!');
}

if (typeof describe !== 'undefined') {
  describe('Widescreen Layout & Flat UI', function () {
    it('should satisfy all layout, hero header, and flat button specifications', function () {
      runTests();
    });
  });
} else {
  runTests();
}
