# Kế Hoạch Triển Khai: Tối Ưu Bố Cục Màn Hình Rộng, Document Hero Header & Flat UI Nút Bấm

- **Tài liệu thiết kế:** [2026-09-09-widescreen-doc-layout-and-flat-ui-design.md](file:///home/lamnh/projects/techdoc/docs/superpowers/specs/2026-09-09-widescreen-doc-layout-and-flat-ui-design.md)
- **Ngày tạo:** 2026-09-09
- **Trạng thái:** Sẵn sàng thực thi (Ready to Execute)

---

## Giai đoạn 1: Tinh Chỉnh CSS (Bố cục Widescreen, Hero Header & Nút Bấm Flat)

### Bước 1.1: Gỡ bỏ Padding 40px thừa và nới lỏng giới hạn chiều rộng
- **Tệp cần sửa:** `app/public/css/docusaurus-theme.css` và `app/public/css/markdown.css`
- **Mục tiêu:**
  - Trong `docusaurus-theme.css`: Ghi đè `#doc.markdown-body` và `.markdown-body` với `padding-top: 0 !important; padding-bottom: 0 !important; max-width: 100% !important;`.
  - Cập nhật `.docusaurus-main-content` với `flex: 1; min-width: 0; width: 100%; max-width: none;`.
  - Thay thế `.docusaurus-container` bằng `.docusaurus-layout-wrapper` có `max-width: 1600px; width: 100%; padding: 24px 24px 80px; gap: 36px; box-sizing: border-box;`.

### Bước 1.2: Định nghĩa CSS cho Sidebar Trái (Collapsible Sidebar)
- **Tệp cần sửa:** `app/public/css/docusaurus-theme.css`
- **Mục tiêu:**
  - `.docusaurus-left-sidebar`: Độ rộng `280px`, sticky `top: 80px`, chiều cao `calc(100vh - 100px)`, viền phải `1px solid var(--ifm-toc-border-color)`.
  - `.docusaurus-left-sidebar.collapsed`: `width: 0 !important; margin-left: -280px !important; opacity: 0 !important; padding: 0 !important; border-right: none;`.
  - CSS cho header sidebar, ô input quick search, danh sách thẻ ghi chú (hover effects, active state).

### Bước 1.3: Định nghĩa CSS cho Document Hero Header
- **Tệp cần sửa:** `app/public/css/docusaurus-theme.css`
- **Mục tiêu:**
  - `.doc-hero-header`: Margin dưới `28px`, padding dưới `20px`, viền đáy nhẹ `1px solid #e2e8f0`.
  - `.doc-hero-title`: Cỡ chữ lớn `2.25rem - 2.5rem` (~`36px - 40px`), `font-weight: 800`, màu `#0f172a`, `letter-spacing: -0.025em`, không viền gạch dưới.
  - `.doc-hero-meta`: Flex container, màu `#64748b`, font-size `13px`, icon và thông tin ngày cập nhật, view count.

### Bước 1.4: Chuẩn hóa bộ CSS Nút bấm dạng Flat (Flat Buttons)
- **Tệp cần sửa:** `app/public/css/docusaurus-theme.css`
- **Mục tiêu:**
  - `.docusaurus-flat-btn`: `box-shadow: none !important; border-radius: 6px; font-size: 13px; font-weight: 500; padding: 6px 14px;`.
  - Biến thể: `.docusaurus-flat-btn-default`, `.docusaurus-flat-btn-primary`, `.docusaurus-flat-btn-danger`.
  - `.docusaurus-sidebar-toggle`: Nút icon toggle flat trên thanh điều hướng.

---

## Giai đoạn 2: Cập Nhật Cấu Trúc HTML Template (`app/public/views/pretty.ejs`)

### Bước 2.1: Cập nhật Navbar với Toggle và Nút bấm Flat
- Thêm nút `#sidebarToggleBtn` dạng icon flat ở bên trái logo TechDoc.
- Chuyển các nút Trang chủ, Chỉnh sửa, Thùng rác sang class `.docusaurus-flat-btn`.

### Bước 2.2: Bổ sung Sidebar Trái vào DOM
- Đặt thẻ `<aside id="docusaurusLeftSidebar" class="docusaurus-left-sidebar">` trước thẻ `<main>`.
- Bao gồm: Tiêu đề sidebar kèm nút đóng nhanh `#sidebarCloseBtn`, ô input tìm kiếm nhanh `#sidebarQuickSearch`, và container danh sách ghi chú `#sidebarNotesList`.

### Bước 2.3: Bổ sung Document Hero Header
- Đặt khối `<div class="doc-hero-header">` ngay đầu `<main class="docusaurus-main-content">`, trên thẻ `#doc`.
- Render tiêu đề lớn và thông tin metadata (thời gian cập nhật, lượt xem).

---

## Giai đoạn 3: Hiện Thực Logic JavaScript Tương Tác

### Bước 3.1: Logic Expand / Collapse Sidebar & Lưu LocalStorage
- **Tệp cần sửa:** `app/public/js/pretty.js` (hoặc script nhúng hỗ trợ).
- Lắng nghe click trên `#sidebarToggleBtn` và `#sidebarCloseBtn`.
- Khi trạng thái thay đổi: toggle class `.collapsed` trên `#docusaurusLeftSidebar` và lưu `'true'` / `'false'` vào `localStorage.getItem('techdoc_sidebar_collapsed')`.
- Tự động kiểm tra `localStorage` khi khởi tạo trang để áp dụng trạng thái đã lưu ngay lập tức (không bị chớp giật giao diện).

### Bước 3.2: Render Danh Sách Ghi Chú Gần Đây & Bộ Lọc Nhanh (Quick Filter)
- Đọc danh sách ghi chú từ `localStorage.getItem('history')` (hoặc mảng lịch sử sẵn có của TechDoc).
- Render các item ghi chú: link trỏ đến tài liệu, tiêu đề, thời gian; đánh dấu class `active` cho ghi chú hiện tại.
- Sự kiện `input` trên `#sidebarQuickSearch`: lọc danh sách ngay lập tức theo từ khóa.

### Bước 3.3: Khử trùng lặp tiêu đề H1 đầu bài
- Kiểm tra thẻ `h1` đầu tiên trong `#doc`. Nếu nội dung trùng khớp với tên tài liệu ở Hero Header, tự động ẩn (`style.display = 'none'`) để tránh bị lặp lại 2 tiêu đề to liền kề.

---

## Giai đoạn 4: Kiểm Thử Tự Động & Đánh Giá Giao Diện

### Bước 4.1: Kiểm tra Unit Tests
- Chạy toàn bộ test suites hiện có: `node app/test/docusaurus-theme.test.js`, `node app/test/docusaurus-tokens.test.js`, `node app/test/inpage-search.test.js`.
- Bổ sung test case kiểm tra selector bố cục mới `.docusaurus-layout-wrapper`, `.doc-hero-header`, `.docusaurus-flat-btn`.

### Bước 4.2: Kiểm tra trực tiếp trên trình duyệt & HTTP Response
- Kiểm tra curl HTTP response của view tài liệu `/features` hoặc ghi chú bất kỳ.
- Xác nhận các class mới, Hero Header và Flat Buttons hiển thị đúng và không có lỗi JS trong console.
