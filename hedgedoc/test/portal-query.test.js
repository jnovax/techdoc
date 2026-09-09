'use strict'
const assert = require('assert')

function buildWhereClause (user) {
  if (!user) {
    return { permission: ['freely', 'editable', 'locked'] }
  }
  return {
    $or: [
      { permission: ['freely', 'editable', 'locked', 'protected', 'limited'] },
      { permission: 'private', ownerId: user.id }
    ]
  }
}

function runTests () {
  const guestWhere = buildWhereClause(null)
  assert.deepStrictEqual(guestWhere.permission, ['freely', 'editable', 'locked'])

  const userWhere = buildWhereClause({ id: 'user-123' })
  assert.strictEqual(userWhere.$or.length, 2)
  assert.strictEqual(userWhere.$or[1].ownerId, 'user-123')
  assert.strictEqual(userWhere.$or[1].permission, 'private')
  console.log('Portal query logic tests passed!')
}

if (typeof describe !== 'undefined') {
  describe('Document Catalog Query Logic', function () {
    it('should restrict guests to public permissions only and allow owners private notes', function () {
      runTests()
    })
  })
} else {
  runTests()
}
