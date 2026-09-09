'use strict'
const assert = require('assert')

function sanitizeReturnTo (url) {
  if (!url || typeof url !== 'string') return '/'
  if (url.startsWith('/') && !url.startsWith('//')) return url
  return '/'
}

function runTests () {
  assert.strictEqual(sanitizeReturnTo('/p/note-123'), '/p/note-123')
  assert.strictEqual(sanitizeReturnTo('https://evil.com'), '/')
  assert.strictEqual(sanitizeReturnTo('//evil.com'), '/')
  assert.strictEqual(sanitizeReturnTo(''), '/')
  console.log('Login redirect tests passed!')
}

if (typeof describe !== 'undefined') {
  describe('Login & Redirection Logic', function () {
    it('should sanitize returnTo to only allow relative paths', function () {
      runTests()
    })
  })
} else {
  runTests()
}

