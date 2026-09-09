'use strict'
const assert = require('assert')

function slugify (text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u00C0-\u024F\u1EA0-\u1EF9\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

function parseHeadings (headings) {
  return headings.map((h, idx) => ({
    level: parseInt(h.tagName.replace('H', ''), 10),
    text: h.textContent.trim(),
    id: h.id || slugify(h.textContent) || 'heading-' + idx
  }))
}

function runTests () {
  // Test 1: Slugification (Unicode & Vietnamese support)
  assert.strictEqual(slugify('HedgeDoc Installation & Setup'), 'hedgedoc-installation-setup')
  assert.strictEqual(slugify('Hướng dẫn sử dụng hệ thống!'), 'hướng-dẫn-sử-dụng-hệ-thống')
  assert.strictEqual(slugify(''), '')

  // Test 2: Headings hierarchy extraction
  const mockHeadings = [
    { tagName: 'H1', textContent: 'Giới thiệu', id: '' },
    { tagName: 'H2', textContent: 'Cài đặt', id: 'cai-dat' },
    { tagName: 'H3', textContent: 'Cấu hình Docker', id: '' }
  ]

  const parsed = parseHeadings(mockHeadings)
  assert.strictEqual(parsed.length, 3)
  assert.strictEqual(parsed[0].level, 1)
  assert.strictEqual(parsed[0].id, 'giới-thiệu')
  assert.strictEqual(parsed[1].id, 'cai-dat')
  assert.strictEqual(parsed[2].level, 3)
  assert.strictEqual(parsed[2].id, 'cấu-hình-docker')

  console.log('Docusaurus theme & TOC logic tests passed!')
}

if (typeof describe !== 'undefined') {
  describe('Docusaurus TOC Logic', function () {
    it('should correctly slugify headings and parse hierarchy', function () {
      runTests()
    })
  })
} else {
  runTests()
}
