# Kế Hoạch Triển Khai: Chuẩn Hóa TOC & UI Components Theo Phong Cách HackMD Neo

**Tài liệu tham chiếu:** [docs/superpowers/specs/2026-09-11-hackmd-neo-toc-components-design.md](file:///home/lamnh/projects/techdoc/docs/superpowers/specs/2026-09-11-hackmd-neo-toc-components-design.md)  
**Ngày lập:** 2026-09-11  
**Trạng thái:** Sẵn sàng thực thi  

---

## 1. Mục tiêu Tổng thể
Triển khai toàn bộ thiết kế đã duyệt trong spec:
1. Dọn dẹp các đoạn mã CSS/JS/DOM của TOC cũ không còn sử dụng.
2. Tạo module `app/public/css/hackmd-neo.css` định nghĩa toàn bộ Design Tokens và chuẩn hóa UI (Navbar, Segmented Mode Controls, Infobar, Badges, Buttons, Modals).
3. Tạo module `app/public/js/techdoc-toc.js` điều khiển TOC thông minh 2 chế độ:
   * View mode: Sticky Sidebar bên phải.
   * Both mode / Mobile: Floating trigger button và Drawer trượt mở.
   * Scrollspy `IntersectionObserver` và realtime debounce sync.
4. Tích hợp vào `app/public/views/techdoc/` (`head.ejs`, `header.ejs`, `body.ejs`, `footer.ejs`).
5. Kiểm thử toàn diện ở cả 2 theme Dark/Light và xác nhận không có lỗi hồi quy.

---

## 2. Danh sách Nhiệm vụ Chi tiết (Task Breakdown)

### Task 1: Dọn dẹp các thành phần TOC cũ (DOM & CSS/JS Cleanup)
- **Mục tiêu**: Loại bỏ code thừa, tránh xung đột CSS và giải phóng dung lượng.
- **Các bước thực hiện**:
  1. Trong `app/public/views/techdoc/body.ejs`: Xóa bỏ dropup `.ui-toc` (dòng 37–45) và `#ui-toc-affix` (dòng 46).
  2. Trong `app/public/css/extra.css`: Xóa bỏ các block rule cũ liên quan đến `.ui-toc-dropdown`, `.ui-affix-toc`, `.expand-toggle`, `.back-to-top`, `.go-to-bottom`.
  3. Trong `app/public/js/extra.js`: Loại bỏ lời gọi hàm `generateToc()` cũ khi render view.
- **Tiêu chí nghiệm thu**: Ứng dụng không còn render menu dropup cũ ở góc dưới; không có lỗi JavaScript khi load view.
- **Commit**: `refactor(techdoc): clean up legacy toc dom elements and outdated css rules`

---

### Task 2: Xây dựng Module CSS HackMD Neo (`app/public/css/hackmd-neo.css`)
- **Mục tiêu**: Chuẩn hóa toàn bộ hệ thống style và component theo phong cách phẳng tối giản của HackMD Neo.
- **Các bước thực hiện**:
  1. Định nghĩa Design Tokens (Màu nền, màu chữ, viền, bo góc, bóng đổ) cho cả 2 theme Light và Dark.
  2. Chuẩn hóa Top Navbar (`.navbar-default`): Viền mảnh 1px, nền phẳng, căn chỉnh chiều cao 56px.
  3. Chuẩn hóa Segmented Mode Switcher: Container bo góc 6px với đệm, active state nổi bật phẳng, hiệu ứng chuyển tab êm ái.
  4. Chuẩn hóa Infobar & Permission Selector: Nút chọn quyền dạng Flat Badge có viền mảnh, dropdown menu bo góc 6px, hover nhẹ nhàng.
  5. Chuẩn hóa hệ thống nút bấm (`.neo-btn`, `.neo-btn-primary`, `.neo-btn-tertiary`, `.neo-btn-danger`) và Form Inputs.
  6. Chuẩn hóa Modals: Bo góc 8px, viền 1px, nền backdrop làm mờ kính `backdrop-filter: blur(4px)`.
  7. Định kiểu cho cụm TOC (Sidebar bám cạnh và Floating Drawer).
- **Tiêu chí nghiệm thu**: File CSS được nhúng trong `techdoc/head.ejs`; toàn bộ các component trên giao diện workspace hiển thị đồng nhất, phẳng và sắc sảo ở cả Dark và Light theme.
- **Commit**: `feat(ui): implement hackmd-neo design system and component styles`

---

### Task 3: Xây dựng Engine TOC Linh Hoạt (`app/public/js/techdoc-toc.js`)
- **Mục tiêu**: Cung cấp trải nghiệm TOC hiện đại, mượt mà và tự thích ứng theo chế độ View vs Both mode.
- **Các bước thực hiện**:
  1. Viết logic quét tiêu đề (H1 -> H4) trong `#doc`, sinh ID an toàn nếu chưa có.
  2. Tạo cấu trúc phân cấp DOM mục lục với thụt lề chuẩn xác.
  3. Cài đặt `IntersectionObserver` làm scrollspy theo dõi heading hiện tại và gán `.active` cho link tương ứng.
  4. Cài đặt xử lý cuộn mượt (smooth scroll) khi nhấp vào mục trong TOC.
  5. Cài đặt logic phát hiện chế độ (`View` vs `Both` / `Edit`):
     * View mode: Hiển thị Sticky Sidebar bên phải.
     * Both mode hoặc màn hình hẹp (< 1200px): Hiển thị nút Floating Trigger, quản lý mở/đóng Drawer.
     * Edit mode: Ẩn hoàn toàn TOC.
     * Ẩn TOC nếu bài viết có ít hơn 2 tiêu đề.
  6. Lắng nghe thay đổi DOM của `#doc` với debounce 300ms để cập nhật mục lục realtime khi đang gõ bài.
- **Tiêu chí nghiệm thu**: TOC chuyển đổi mượt mà giữa Sidebar và Drawer khi đổi mode; cuộn trang làm highlight chính xác; nhấp chuột cuộn mượt đến tiêu đề.
- **Commit**: `feat(toc): implement dual-mode responsive toc engine with scrollspy`

---

### Task 4: Cập nhật Cấu trúc Template EJS (`techdoc/`)
- **Mục tiêu**: Tích hợp các module mới vào cây HTML của TechDoc.
- **Các bước thực hiện**:
  1. `app/public/views/techdoc/head.ejs`: Nhúng stylesheet `hackmd-neo.css`.
  2. `app/public/views/techdoc/header.ejs`: Cập nhật cấu trúc HTML của Navbar và Segmented Mode Switcher.
  3. `app/public/views/techdoc/body.ejs`: Cập nhật Infobar, chèn cấu trúc `#neoTocWrapper`.
  4. `app/public/views/techdoc/footer.ejs`: Nhúng script `techdoc-toc.js`.
- **Tiêu chí nghiệm thu**: Trang `techdoc` tải đầy đủ các file mới, cấu trúc HTML hợp lệ, không có thẻ mở/đóng sai lệch.
- **Commit**: `feat(views): integrate hackmd-neo components and toc wrapper into techdoc templates`

---

### Task 5: Kiểm thử Toàn diện & Tinh chỉnh Hoàn thiện (Verification & Polish)
- **Mục tiêu**: Xác nhận chất lượng, tính thẩm mỹ và độ tương thích.
- **Các bước thực hiện**:
  1. Kiểm thử hiển thị và tương tác ở chế độ View: Cuộn trang, active indicator bám đúng vị trí.
  2. Kiểm thử ở chế độ Both: Mở drawer nổi, đóng bằng nút X hoặc click ra ngoài.
  3. Kiểm thử chuyển đổi Dark / Light mode: Mọi màu sắc, viền, chữ và icon đều tương phản tốt.
  4. Kiểm thử các Modal: Mở modal Xóa note, modal Import Clipboard/Gist...
  5. Kiểm tra phím tắt (`Ctrl+Alt+V`, `Ctrl+Alt+B`, `Ctrl+Alt+E`, `Ctrl+F`).
  6. Rà soát console log, đảm bảo không có warning hay lỗi runtime.
- **Tiêu chí nghiệm thu**: Tất cả các kịch bản kiểm thử đều đạt; giao diện hoàn toàn đồng bộ theo phong cách HackMD Neo.
- **Commit**: `chore(techdoc): polish neo styling and verify cross-mode compatibility`
