'use strict'
const assert = require('assert')

function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getNextIndex (currentIndex, totalCount, direction) {
  if (totalCount === 0) return -1
  if (direction === 'next') {
    return (currentIndex + 1) % totalCount
  } else if (direction === 'prev') {
    return (currentIndex - 1 + totalCount) % totalCount
  }
  return currentIndex
}

function runTests () {
  // Test 1: Regex escaping
  assert.strictEqual(escapeRegExp('abc.def*ghi+jkl'), 'abc\\.def\\*ghi\\+jkl')
  assert.strictEqual(escapeRegExp('hello [world]?'), 'hello \\x5bworld\\x5d\\x3f'.replace(/\\x5b/g, '\\[').replace(/\\x5d/g, '\\]').replace(/\\x3f/g, '\\?'))

  // Test 2: Next index wrapping
  assert.strictEqual(getNextIndex(0, 3, 'next'), 1)
  assert.strictEqual(getNextIndex(1, 3, 'next'), 2)
  assert.strictEqual(getNextIndex(2, 3, 'next'), 0) // Loop back to start

  // Test 3: Prev index wrapping
  assert.strictEqual(getNextIndex(0, 3, 'prev'), 2) // Loop to end
  assert.strictEqual(getNextIndex(2, 3, 'prev'), 1)
  assert.strictEqual(getNextIndex(1, 3, 'prev'), 0)

  console.log('In-page search logic tests passed!')
}

if (typeof describe !== 'undefined') {
  describe('In-Page Search Logic', function () {
    it('should correctly escape regex and wrap match indices', function () {
      runTests()
    })
  })
} else {
  runTests()
}
