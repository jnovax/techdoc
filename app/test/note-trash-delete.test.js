'use strict'
const assert = require('assert')

function canUserManageNote (note, user) {
  if (!user || !user.id) return false
  if (!note || !note.ownerId) return false
  return note.ownerId === user.id
}

function softDeleteNote (note) {
  if (!note) return false
  note.deletedAt = new Date()
  return true
}

function restoreNote (note) {
  if (!note) return false
  note.deletedAt = null
  return true
}

function permanentDeleteNote (noteList, noteId) {
  if (!Array.isArray(noteList)) return false
  const index = noteList.findIndex(n => n.id === noteId)
  if (index !== -1) {
    noteList.splice(index, 1)
    return true
  }
  return false
}

function runTests () {
  const userA = { id: 'user-aaa-111' }
  const userB = { id: 'user-bbb-222' }
  const guest = null

  const noteOfA = { id: 'note-1', title: 'Tài liệu A', ownerId: 'user-aaa-111', deletedAt: null }
  const anonymousNote = { id: 'note-2', title: 'Ghi chú ẩn danh', ownerId: null, deletedAt: null }

  // Test 1: Quyền hạn thao tác (Chỉ owner mới có quyền)
  assert.strictEqual(canUserManageNote(noteOfA, userA), true, 'Owner phải có quyền xóa')
  assert.strictEqual(canUserManageNote(noteOfA, userB), false, 'User khác không được xóa')
  assert.strictEqual(canUserManageNote(noteOfA, guest), false, 'Khách vãng lai không được xóa')
  assert.strictEqual(canUserManageNote(anonymousNote, userA), false, 'Ghi chú không chủ không cho phép user tự ý xóa')

  // Test 2: Soft delete (Chuyển vào thùng rác - sets deletedAt)
  assert.strictEqual(softDeleteNote(noteOfA), true)
  assert.ok(noteOfA.deletedAt instanceof Date, 'deletedAt phải là Date sau khi soft delete')
  assert.notStrictEqual(noteOfA.deletedAt, null)

  // Test 3: Khôi phục ghi chú (Restore - clears deletedAt)
  assert.strictEqual(restoreNote(noteOfA), true)
  assert.strictEqual(noteOfA.deletedAt, null, 'deletedAt phải trở về null sau khi khôi phục')

  // Test 4: Force delete (Xóa vĩnh viễn khỏi danh sách)
  const notes = [noteOfA, anonymousNote]
  assert.strictEqual(canUserManageNote(noteOfA, userA), true)
  assert.strictEqual(permanentDeleteNote(notes, 'note-1'), true, 'Phải xóa thành công note-1')
  assert.strictEqual(notes.length, 1)
  assert.strictEqual(notes[0].id, 'note-2')
  assert.strictEqual(permanentDeleteNote(notes, 'non-existent'), false, 'Không tìm thấy note trả về false')

  console.log('Note trash, restore & delete logic tests passed!')
}

if (typeof describe !== 'undefined') {
  describe('Note Trash, Restore and Force Delete Logic', function () {
    it('should correctly enforce owner permission, soft delete, restore, and force delete', function () {
      runTests()
    })
  })
} else {
  runTests()
}
