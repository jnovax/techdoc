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

function extractSnippet (content, maxLength = 140) {
  if (!content || typeof content !== 'string') return ''
  let text = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^[\s#>\-*+~_|=]+/gm, ' ')
    .replace(/[*_~`#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length > maxLength) {
    text = text.slice(0, maxLength).trim() + '...'
  }
  return text
}

function runTests () {
  const guestWhere = buildWhereClause(null)
  assert.deepStrictEqual(guestWhere.permission, ['freely', 'editable', 'locked'])

  const userWhere = buildWhereClause({ id: 'user-123' })
  assert.strictEqual(userWhere.$or.length, 2)
  assert.strictEqual(userWhere.$or[1].ownerId, 'user-123')
  assert.strictEqual(userWhere.$or[1].permission, 'private')

  // Test extractSnippet cleans HTML tags and markdown
  const htmlSample = '<div align="center"><h1 align="center">Docusaurus<br /><a href="https://docusaurus.io"><img src="slash.svg"></a></h1></div>\n\nDocs make easy.'
  const cleanSnippet = extractSnippet(htmlSample)
  assert.ok(!cleanSnippet.includes('<div'), 'Snippet must not contain HTML tags')
  assert.ok(!cleanSnippet.includes('href='), 'Snippet must not contain anchor attributes')
  assert.strictEqual(cleanSnippet, 'Docusaurus Docs make easy.')

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
