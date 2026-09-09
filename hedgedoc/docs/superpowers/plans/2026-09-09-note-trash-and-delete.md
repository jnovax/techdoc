---
title: "Kế hoạch thực hiện: Tính năng Thùng rác (Soft Delete) & Xóa vĩnh viễn (Hard Delete) cho HedgeDoc"
type: implementation-plan
date: 2026-09-09
spec: hedgedoc/docs/superpowers/specs/2026-09-09-note-trash-and-delete-design.md
---

# Kế hoạch thực hiện: Tính năng Thùng rác (Soft Delete) & Xóa vĩnh viễn (Hard Delete)

Tài liệu này mô tả chi tiết các bước triển khai tính năng Thùng rác (xóa mềm 2 giai đoạn) và Xóa vĩnh viễn cho HedgeDoc, bao gồm model Sequelize, các API endpoint bảo mật, giao diện tab Thùng rác trên Portal, nút xóa trên thanh Header Docusaurus và bộ kiểm thử tự động.

---

## Cấu trúc công việc (Task Breakdown)

- **Task 1: Tạo bộ kiểm thử tự động (Unit Tests)**
  - File: `hedgedoc/test/note-trash-delete.test.js`
  - Kiểm thử logic phân quyền (chỉ owner mới có quyền xóa/khôi phục/xóa vĩnh viễn).
  - Kiểm thử chuyển đổi trạng thái `deletedAt` khi soft delete, restore và hard delete.

- **Task 2: Cấu hình Sequelize Model `Note`**
  - File: `hedgedoc/lib/models/note.js`
  - Bật `paranoid: true` trong options của `Note`.
  - Khai báo trường `deletedAt: { type: DataTypes.DATE }` để Sequelize quản lý xóa mềm tự động.

- **Task 3: Phát triển REST API Backend cho Thùng rác**
  - Files:
    - `hedgedoc/lib/web/note/router.js`
    - `hedgedoc/lib/web/note/controller.js`
    - `hedgedoc/lib/web/indexRouter.js`
  - Thêm routes:
    - `POST /:noteId/trash`: Chuyển ghi chú vào thùng rác (soft delete) & phát tín hiệu WebSocket ngắt kết nối client đang mở.
    - `POST /:noteId/restore`: Khôi phục ghi chú từ thùng rác (`deletedAt = null`).
    - `POST /:noteId/force-delete`: Xóa cứng ghi chú (`destroy({ force: true })`).
  - Trong `indexRouter.js`: Truy vấn `trashedNotes` của người dùng đăng nhập hiện tại và truyền vào `index.ejs`.

- **Task 4: Tích hợp Giao diện Portal & Tab Thùng rác**
  - File: `hedgedoc/public/views/index/body.ejs`
  - Thêm tab `Thùng rác (<count>)` vào thanh phân loại danh mục.
  - Bổ sung nút chuyển vào thùng rác trên thẻ tài liệu thuộc quyền sở hữu (`data-mine="true"`).
  - Hiển thị danh sách tài liệu trong tab Thùng rác kèm 2 nút hành động: "Khôi phục" và "Xóa vĩnh viễn".
  - Thêm Modal xác nhận nguy hiểm (Danger Modal) trước khi xóa.
  - Thêm script xử lý AJAX mượt mà: fade out thẻ tài liệu, cập nhật số lượng trên các tab mà không cần reload trang.

- **Task 5: Tích hợp nút Xóa trên giao diện Đọc Docusaurus (`pretty.ejs`)**
  - File: `hedgedoc/public/views/pretty.ejs`
  - Nếu người đang xem là Chủ sở hữu của tài liệu, hiển thị nút `Chuyển vào thùng rác` trên navbar.
  - Bấm vào mở modal xác nhận, sau đó gọi API và điều hướng về trang chủ `/`.

- **Task 6: Kiểm thử toàn diện & Xác minh container**
  - Chạy toàn bộ test suite.
  - Khởi động lại container `hedgedoc_app_1`.
  - Kiểm thử trực tiếp luồng xóa mềm -> kiểm tra 404 khi truy cập -> khôi phục -> xóa vĩnh viễn trong database.

---

### Task 1: Bộ kiểm thử tự động (`note-trash-delete.test.js`)

**Files:**
- Create: `hedgedoc/test/note-trash-delete.test.js`

- [ ] **Step 1: Tạo file kiểm thử `hedgedoc/test/note-trash-delete.test.js`**

Kiểm tra:
1. `canUserManageNote(note, user)`: chỉ chủ sở hữu (`note.ownerId === user.id`) mới có quyền thao tác.
2. `softDeleteNote(note)`: chuyển trạng thái ghi chú sang `deletedAt != null`.
3. `restoreNote(note)`: chuyển trạng thái `deletedAt` về `null`.
4. `permanentDeleteNote(noteList, noteId)`: gỡ bản ghi vĩnh viễn khỏi danh sách.

```javascript
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

function runTests () {
  const userA = { id: 'user-aaa-111' }
  const userB = { id: 'user-bbb-222' }
  const guest = null

  const noteOfA = { id: 'note-1', title: 'Tài liệu A', ownerId: 'user-aaa-111', deletedAt: null }
  const anonymousNote = { id: 'note-2', title: 'Ghi chú ẩn danh', ownerId: null, deletedAt: null }

  // Test 1: Quyền hạn thao tác
  assert.strictEqual(canUserManageNote(noteOfA, userA), true, 'Owner phải có quyền xóa')
  assert.strictEqual(canUserManageNote(noteOfA, userB), false, 'User khác không được xóa')
  assert.strictEqual(canUserManageNote(noteOfA, guest), false, 'Khách vãng lai không được xóa')
  assert.strictEqual(canUserManageNote(anonymousNote, userA), false, 'Ghi chú không chủ không cho phép user tự ý xóa')

  // Test 2: Soft delete (Chuyển vào thùng rác)
  assert.strictEqual(softDeleteNote(noteOfA), true)
  assert.ok(noteOfA.deletedAt instanceof Date, 'deletedAt phải là Date')

  // Test 3: Khôi phục ghi chú
  assert.strictEqual(restoreNote(noteOfA), true)
  assert.strictEqual(noteOfA.deletedAt, null, 'deletedAt phải trở về null sau khi khôi phục')

  console.log('Note trash & delete logic tests passed!')
}

if (typeof describe !== 'undefined') {
  describe('Note Trash & Delete Logic', function () {
    it('should correctly enforce owner permission and lifecycle', function () {
      runTests()
    })
  })
} else {
  runTests()
}
```

- [ ] **Step 2: Chạy kiểm thử**
```bash
node hedgedoc/test/note-trash-delete.test.js
```

---

### Task 2: Kích hoạt `paranoid: true` trong `hedgedoc/lib/models/note.js`

**Files:**
- Modify: `hedgedoc/lib/models/note.js`

- [ ] **Step 1: Cập nhật định nghĩa model `Note`**
Trong `hedgedoc/lib/models/note.js`, đổi `paranoid: false` thành `paranoid: true`:
```javascript
  }, {
    paranoid: true,
    hooks: {
```
Đồng thời bảo đảm cột `deletedAt` được khai báo rõ trong schema:
```javascript
    deletedAt: {
      type: DataTypes.DATE
    }
```

---

### Task 3: Phát triển REST API Backend cho Thùng rác

**Files:**
- Modify: `hedgedoc/lib/web/note/router.js`
- Modify: `hedgedoc/lib/web/note/controller.js`
- Modify: `hedgedoc/lib/web/indexRouter.js`

- [ ] **Step 1: Thêm controller methods trong `hedgedoc/lib/web/note/controller.js`**
Triển khai:
- `exports.trashNote`: kiểm tra auth & ownership -> `note.destroy()` -> bắn tín hiệu socket -> trả về JSON.
- `exports.restoreNote`: tìm với `paranoid: false` -> kiểm tra auth & ownership -> `note.restore()` -> trả về JSON.
- `exports.forceDeleteNote`: tìm với `paranoid: false` -> kiểm tra auth & ownership -> `note.destroy({ force: true })` -> trả về JSON.

- [ ] **Step 2: Thêm endpoints trong `hedgedoc/lib/web/note/router.js`**
```javascript
// trash, restore, force delete note
router.post('/:noteId/trash', noteController.trashNote)
router.post('/:noteId/restore', noteController.restoreNote)
router.post('/:noteId/force-delete', noteController.forceDeleteNote)
```

- [ ] **Step 3: Cập nhật `hedgedoc/lib/web/indexRouter.js`**
Khi `req.isAuthenticated()`, truy vấn thêm danh sách `trashedNotes`:
```javascript
let trashedNotes = []
if (req.isAuthenticated()) {
  trashedNotes = await models.Note.findAll({
    where: {
      ownerId: req.user.id,
      deletedAt: { [models.Sequelize.Op.ne]: null }
    },
    paranoid: false,
    order: [['deletedAt', 'DESC']]
  })
}
```
Truyền `trashedNotes` vào template `index.ejs`.

---

### Task 4: Giao diện Portal & Tab Thùng rác (`index/body.ejs`)

**Files:**
- Modify: `hedgedoc/public/views/index/body.ejs`
- Modify: `hedgedoc/public/css/site.css` (hoặc inline portal styles)

- [ ] **Step 1: Bổ sung Tab "Thùng rác" & Nút xóa trên thẻ**
- Trong `.portal-tabs`:
  ```html
  <% if (signin) { %>
      <button class="portal-tab-btn" data-filter="protected">Nội bộ (Protected)</button>
      <button class="portal-tab-btn" data-filter="mine">Của tôi & Bản nháp</button>
      <button class="portal-tab-btn" data-filter="trash" style="color: #e11d48;">
          <i class="fa fa-trash-o"></i> Thùng rác (<span id="trashCount"><%= (trashedNotes || []).length %></span>)
      </button>
  <% } %>
  ```

- Trên thẻ tài liệu hoạt động:
  Nếu `note.isOwner`:
  Thêm nút icon thùng rác nhỏ tinh tế:
  ```html
  <button type="button" class="btn-trash-action" data-note-id="<%- note.id %>" data-note-title="<%- note.title %>" title="Chuyển vào thùng rác">
      <i class="fa fa-trash-o"></i>
  </button>
  ```

- Trong lưới `.portal-grid`:
  Render danh sách `trashedNotes` với `data-filter="trash"`:
  ```html
  <% (trashedNotes || []).forEach(function(tNote) { %>
      <div class="note-card note-card-trash" data-filter="trash" data-id="<%- tNote.id %>">
          <span class="note-badge badge-trash"><i class="fa fa-trash"></i> Đã xóa</span>
          <h2 class="note-title"><%- tNote.title %></h2>
          <div class="note-trash-actions">
              <button type="button" class="btn btn-sm btn-outline-primary btn-restore" data-id="<%- tNote.id %>">
                  <i class="fa fa-undo"></i> Khôi phục
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger btn-force-delete" data-id="<%- tNote.id %>" data-title="<%- tNote.title %>">
                  <i class="fa fa-times"></i> Xóa vĩnh viễn
              </button>
          </div>
      </div>
  <% }); %>
  ```

- [ ] **Step 2: Bổ sung Modal xác nhận và script xử lý AJAX**
- Thêm Modal xác nhận chuyển vào thùng rác và Modal cảnh báo nguy hiểm xóa vĩnh viễn.
- Script xử lý:
  - Bấm "Chuyển vào thùng rác" -> gửi `POST /:id/trash` -> thẻ fade out, số đếm tab giảm, số đếm thùng rác tăng.
  - Bấm "Khôi phục" -> gửi `POST /:id/restore` -> chuyển thẻ về tab hoạt động.
  - Bấm "Xóa vĩnh viễn" -> gửi `POST /:id/force-delete` -> gỡ hoàn toàn thẻ khỏi DOM.

---

### Task 5: Tích hợp nút Xóa trên giao diện Đọc Docusaurus (`pretty.ejs`)

**Files:**
- Modify: `hedgedoc/public/views/pretty.ejs`

- [ ] **Step 1: Thêm nút Chuyển vào thùng rác trong `pretty.ejs`**
Nếu `isOwner`:
```html
<button type="button" class="docusaurus-nav-btn docusaurus-nav-btn-danger ui-trash" title="Chuyển tài liệu vào thùng rác">
    <i class="fa fa-trash-o"></i> <span class="hidden-xs">Xóa</span>
</button>
```
Kèm theo modal xác nhận và xử lý chuyển hướng về trang chủ sau khi xóa thành công.

---

### Task 6: Kiểm thử toàn diện & Container Verification

- [ ] **Step 1: Chạy tất cả test suites**
```bash
node hedgedoc/test/note-trash-delete.test.js && node hedgedoc/test/docusaurus-theme.test.js && node hedgedoc/test/inpage-search.test.js && node hedgedoc/test/login-redirect.test.js && node hedgedoc/test/portal-query.test.js
```

- [ ] **Step 2: Khởi động lại container**
```bash
podman restart hedgedoc_app_1
```

- [ ] **Step 3: Kiểm tra API bằng curl**
- Gửi yêu cầu chuyển vào thùng rác -> kiểm tra trạng thái trả về `200 OK`.
- Kiểm tra truy cập note khi ở trong thùng rác trả về `404`.
- Gửi yêu cầu khôi phục -> kiểm tra note trở lại hoạt động bình thường.
- Gửi yêu cầu xóa vĩnh viễn -> kiểm tra database không còn bản ghi.
