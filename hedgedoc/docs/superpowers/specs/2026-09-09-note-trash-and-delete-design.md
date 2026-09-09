# Đặc tả thiết kế: Tính năng Thùng rác (Soft Delete) & Xóa vĩnh viễn (Hard Delete) cho HedgeDoc

**Ngày lập:** 2026-09-09  
**Trạng thái:** Chờ phê duyệt (Pending Approval)  
**Mục tiêu:** Cung cấp giải pháp xóa tài liệu an toàn 2 giai đoạn: chuyển vào thùng rác (xóa mềm - có thể khôi phục) và xóa vĩnh viễn (xóa cứng) dành cho chủ sở hữu tài liệu.

---

## 1. Bối cảnh & Mục tiêu nghiệp vụ

Hiện tại trong HedgeDoc:
- Cột `deletedAt` (TIMESTAMP WITH TIME ZONE) đã có sẵn trong bảng `Notes` (PostgreSQL) từ migration trước đó nhưng chưa được kích hoạt logic `paranoid` của Sequelize.
- Chưa có giao diện người dùng (UI) trên trang chủ Portal cũng như trang Đọc Docusaurus (`pretty.ejs`) để xóa ghi chú.
- Người dùng cần một quy trình xóa an toàn: xóa nhầm có thể vào Thùng rác khôi phục; chỉ khi chủ động chọn "Xóa vĩnh viễn" trong Thùng rác thì dữ liệu mới bị hủy hoàn toàn.

---

## 2. Kiến trúc & Mô hình dữ liệu

### 2.1. Cấu hình Sequelize Model (`hedgedoc/lib/models/note.js`)
- Bật cờ `paranoid: true` trong định nghĩa model `Note`.
- Mặc định mọi truy vấn đọc tài liệu thông thường (`findAll`, `findOne`, `findByPk`) sẽ tự động bổ sung điều kiện `WHERE "Notes"."deletedAt" IS NULL`.
- Tài liệu đang ở trạng thái thùng rác (`deletedAt IS NOT NULL`) sẽ tự động:
  - Bị ẩn khỏi trang chủ Portal đối với tất cả người dùng khác.
  - Bị chặn truy cập trực tiếp qua đường dẫn `/noteId` hoặc `/s/shortid` (trả về lỗi HTTP 404).

### 2.2. Cơ chế Xóa vĩnh viễn (Hard Delete)
- Nhờ cấu hình Foreign Key với `ON DELETE CASCADE` trên bảng `Revisions` và `Authors` trong PostgreSQL:
  ```sql
  "Revisions_note_fkey" FOREIGN KEY ("noteId") REFERENCES "Notes"(id) ON DELETE CASCADE
  "Author_note_fkey" FOREIGN KEY ("noteId") REFERENCES "Notes"(id) ON DELETE CASCADE
  ```
  Khi thực hiện xóa vĩnh viễn `note.destroy({ force: true })`, PostgreSQL sẽ tự động xóa sạch các bản ghi sửa đổi lịch sử và tác giả mà không để lại dữ liệu rác.

---

## 3. Đặc tả API Backend (`hedgedoc/lib/web/note/`)

Bổ sung các route điều khiển trong `lib/web/note/router.js` và `lib/web/note/controller.js`:

### 3.1. Chuyển vào thùng rác (Soft Delete)
- **Endpoint:** `POST /:noteId/trash`
- **Xác thực:** 
  - Người dùng bắt buộc phải đăng nhập (`req.isAuthenticated()`).
  - Phải là Chủ sở hữu của tài liệu (`note.ownerId === req.user.id`). Người không phải chủ sở hữu trả về `HTTP 403 Forbidden`.
- **Hành vi:**
  1. Gọi `note.destroy()` (Sequelize tự gán `deletedAt = NOW()`).
  2. Bắn tín hiệu WebSocket `socket.emit('delete')` đến phòng realtime của ghi chú để ngắt kết nối và điều hướng người xem/sửa về trang chủ.
  3. Trả về JSON: `{ success: true, message: 'Đã chuyển tài liệu vào thùng rác' }`.

### 3.2. Khôi phục tài liệu (Restore)
- **Endpoint:** `POST /:noteId/restore`
- **Xác thực:** Đăng nhập & là Chủ sở hữu tài liệu (`note.ownerId === req.user.id`).
- **Hành vi:**
  1. Tìm ghi chú với tùy chọn `paranoid: false`.
  2. Gọi `note.restore()` (gán `deletedAt = null`).
  3. Trả về JSON: `{ success: true, message: 'Đã khôi phục tài liệu thành công' }`.

### 3.3. Xóa vĩnh viễn (Hard / Force Delete)
- **Endpoint:** `POST /:noteId/force-delete` (hoặc `DELETE /:noteId/force`)
- **Xác thực:** Đăng nhập & là Chủ sở hữu tài liệu.
- **Hành vi:**
  1. Tìm ghi chú với tùy chọn `paranoid: false`.
  2. Gọi `note.destroy({ force: true })` xóa vĩnh viễn bản ghi khỏi database.
  3. Dọn dẹp cache lịch sử nếu có.
  4. Trả về JSON: `{ success: true, message: 'Đã xóa vĩnh viễn tài liệu' }`.

### 3.4. Cung cấp dữ liệu Thùng rác cho Portal
- Trong `lib/web/indexRouter.js`:
  - Khi người dùng đã đăng nhập, truy vấn thêm danh sách tài liệu trong thùng rác của riêng họ:
    ```javascript
    models.Note.findAll({
      where: {
        ownerId: req.user.id,
        deletedAt: { [models.Sequelize.Op.ne]: null }
      },
      paranoid: false,
      order: [['deletedAt', 'DESC']]
    })
    ```
  - Truyền danh sách `trashedNotes` vào template `index.ejs`.

---

## 4. Đặc tả Giao diện & Trải nghiệm người dùng (UI/UX)

### 4.1. Trang chủ Portal (`index/body.ejs`)
1. **Thanh phân loại danh mục (Tabs):**
   - Thêm tab `Thùng rác (<trashedNotes.length>)` có icon `fa-trash-o` bên cạnh tab `Của tôi & Bản nháp` (chỉ hiển thị khi đã đăng nhập).
2. **Thao tác trên thẻ tài liệu hoạt động (Active Notes):**
   - Trên các thẻ do người dùng làm chủ (`data-mine="true"`), bổ sung nút icon thùng rác tinh tế ở góc phải.
   - Khi bấm: Mở Modal xác nhận: *"Chuyển tài liệu vào thùng rác? Bạn có thể khôi phục lại bất cứ lúc nào trong tab Thùng rác."*
   - Xác nhận: Gọi AJAX `POST /:noteId/trash`. Thẻ ghi chú fade-out trượt mượt mà biến mất, số lượng đếm trên tab cập nhật ngay lập tức.
3. **Hiển thị trong Tab "Thùng rác":**
   - Thẻ ghi chú trong thùng rác hiển thị badge màu đỏ/cam: `Đã xóa: <thời gian>`.
   - Vô hiệu hóa liên kết mở bài xem trực tiếp.
   - Bổ sung 2 nút hành động trên thẻ:
     - **Nút "Khôi phục" (Xanh, icon `fa-undo`):** Gọi AJAX `POST /:noteId/restore`, đưa bài viết trở lại danh sách hoạt động.
     - **Nút "Xóa vĩnh viễn" (Đỏ, icon `fa-trash`):** Mở Danger Modal màu đỏ: *"Bạn có chắc chắn muốn xóa vĩnh viễn tài liệu này không? Hành động này KHÔNG THỂ HOÀN TÁC."* -> Bấm xác nhận sẽ gọi `POST /:noteId/force-delete` và gỡ thẻ khỏi DOM.
   - **Empty State:** Nếu thùng rác rỗng, hiển thị icon thùng rác và thông báo *"Thùng rác trống - Không có tài liệu nào bị xóa"*.

### 4.2. Trang Đọc tài liệu phong cách Docusaurus (`pretty.ejs`)
- Nếu người đọc đang đăng nhập và là Chủ sở hữu của tài liệu:
  - Trên thanh Navbar dính (`docusaurus-navbar`), hiển thị thêm nút `Chuyển vào thùng rác` (viền đỏ nhạt, icon `fa-trash-o`).
  - Bấm vào mở Modal xác nhận. Khi xác nhận, gửi yêu cầu chuyển vào thùng rác và chuyển hướng trình duyệt về trang chủ Portal kèm thông báo.

### 4.3. Trang Soạn thảo (`hedgedoc.ejs`)
- Đồng bộ nút menu `Delete this note` sẵn có trong infobar để gọi API chuyển vào thùng rác và điều hướng về trang chủ.

---

## 5. Kế hoạch Kiểm thử & Đảm bảo chất lượng

1. **Unit Tests (`hedgedoc/test/note-trash-delete.test.js`):**
   - Kiểm tra logic phân quyền: chỉ owner mới có quyền xóa/khôi phục/xóa vĩnh viễn.
   - Kiểm tra chuyển vào thùng rác (`deletedAt` được cập nhật).
   - Kiểm tra khôi phục tài liệu (`deletedAt` trở về `null`).
   - Kiểm tra xóa vĩnh viễn (bản ghi bị gỡ bỏ hoàn toàn khỏi DB).
   - Kiểm tra người không phải owner bị trả về mã `403 Forbidden`.
2. **Container & Integration Verification:**
   - Đăng nhập người dùng, tạo thử ghi chú.
   - Chuyển vào thùng rác từ Portal và từ trang xem Docusaurus.
   - Kiểm tra đường dẫn `/s/shortid` bị 404 khi ghi chú ở trong thùng rác.
   - Thử khôi phục từ tab Thùng rác.
   - Thử xóa vĩnh viễn và kiểm tra database không còn bản ghi.
