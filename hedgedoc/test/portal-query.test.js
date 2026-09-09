'use strict'
const assert = require('assert')
const fs = require('fs')
const path = require('path')

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

  // Verify external script assets exist
  const portalJsPath = path.join(__dirname, '../public/js/portal.js')
  assert.ok(fs.existsSync(portalJsPath), 'portal.js must exist')
  const portalJs = fs.readFileSync(portalJsPath, 'utf8')
  assert.ok(portalJs.includes("currentFilter === 'trash'"), 'portal.js must handle trash filter')
  assert.ok(portalJs.includes('.portal-tab-btn'), 'portal.js must handle tab clicks')

  const prettyTrashJsPath = path.join(__dirname, '../public/js/pretty-trash.js')
  assert.ok(fs.existsSync(prettyTrashJsPath), 'pretty-trash.js must exist')

  console.log('Portal query & script logic tests passed!')
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
