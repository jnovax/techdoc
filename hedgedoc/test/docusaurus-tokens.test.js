'use strict'
const assert = require('assert')
const fs = require('fs')
const path = require('path')

function parseCalloutType (text) {
  if (!text) return null
  const match = text.match(/^\[!(NOTE|TIP|INFO|WARNING|DANGER|IMPORTANT)\]/i)
  if (match) {
    const type = match[1].toLowerCase()
    if (type === 'important') return 'warning'
    return type
  }
  return null
}

function runTests () {
  // Test 1: Admonition Callout Parsing
  assert.strictEqual(parseCalloutType('[!NOTE] Đây là ghi chú'), 'note')
  assert.strictEqual(parseCalloutType('[!TIP] Mẹo hay'), 'tip')
  assert.strictEqual(parseCalloutType('[!INFO] Thông tin thêm'), 'info')
  assert.strictEqual(parseCalloutType('[!WARNING] Cảnh báo quan trọng'), 'warning')
  assert.strictEqual(parseCalloutType('[!DANGER] Nguy hiểm chết người'), 'danger')
  assert.strictEqual(parseCalloutType('[!IMPORTANT] Rất quan trọng'), 'warning')
  assert.strictEqual(parseCalloutType('Đoạn trích dẫn thông thường'), null)

  // Test 2: Kiểm tra sự tồn tại của CSS file và các biến token cốt lõi
  const cssPath = path.join(__dirname, '../public/css/docusaurus-theme.css')
  assert.ok(fs.existsSync(cssPath), 'docusaurus-theme.css must exist')
  const css = fs.readFileSync(cssPath, 'utf8')
  const requiredTokens = [
    '--ifm-font-family-base',
    '--ifm-font-family-monospace',
    '--ifm-font-size-base',
    '--ifm-line-height-base',
    '--ifm-leading',
    '--ifm-color-content',
    '--ifm-color-content-secondary',
    '--ifm-color-primary',
    '--ifm-h1-font-size',
    '--ifm-h2-font-size',
    '--ifm-h3-font-size',
    '--ifm-h4-font-size',
    '--ifm-heading-color',
    '--ifm-alert-note-border',
    '--ifm-alert-tip-border',
    '--ifm-alert-info-border',
    '--ifm-alert-warning-border',
    '--ifm-alert-danger-border',
    '--ifm-table-border-color',
    '--ifm-table-head-background',
    '--ifm-toc-border-color'
  ]
  requiredTokens.forEach(token => {
    assert.ok(css.includes(token), `Missing required design token: ${token}`)
  })

  // Test 3: Validate typography declarations
  assert.ok(css.includes('16.5px'), 'Must specify 16.5px base font size')
  assert.ok(css.includes('1.65'), 'Must specify 1.65 line height')
  assert.ok(css.includes('#1c1e21'), 'Must specify #1c1e21 content color')
  assert.ok(css.includes('border-collapse: separate'), 'Table must have separate border collapse')
  assert.ok(css.includes('border-radius: 8px'), 'Table must have 8px border radius')

  console.log('All Docusaurus Design Tokens tests passed successfully!')
}

if (typeof describe !== 'undefined') {
  describe('Docusaurus Design Tokens', function () {
    it('should validate callouts and design tokens', function () {
      runTests()
    })
  })
} else {
  runTests()
}
