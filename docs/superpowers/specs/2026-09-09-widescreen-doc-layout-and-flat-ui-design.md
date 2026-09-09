# Thiết Kế Kỹ Thuật: Tối Ưu Bố Cục Màn Hình Rộng, Document Hero Header & Flat UI Nút Bấm

- **Ngày tạo:** 2026-09-09
- **Trạng thái:** Chờ phê duyệt (Ready for Review)
- **Mục tiêu:** Tái cấu trúc giao diện trình xem tài liệu (Pretty view / Doc viewer) để tận dụng tối đa không gian màn hình rộng, giải quyết triệt để tình trạng nội dung bị "lọt thỏm ở giữa" và padding 40px trùng lặp; bổ sung khu vực Document Title Hero Header lớn, rõ ràng ở đầu trang; tích hợp Sidebar trái điều hướng (có thể thu gọn/mở rộng và lưu trạng thái); và chuẩn hóa toàn bộ nút bấm về phong cách phẳng (Flat Design) thanh lịch.

---

## 1. Mục Tiêu (Goals & Non-Goals)

### Mục tiêu (Goals)
1. **Bố cục 3 cột màn hình rộng (Widescreen 3-Column Layout):**
   - Mở rộng container chính lên đến `1600px` (hoặc `95vw`), chấm dứt tình trạng nội dung bị co cụm hẹp ở giữa màn hình.
   - Bổ sung **Sidebar trái** rộng `280px` hiển thị danh sách ghi chú gần đây và ô tìm kiếm nhanh (Quick filter), hỗ trợ chuyển đổi tài liệu tức thì.
   - Tích hợp tính năng **Thu gọn / Mở rộng (Expand / Collapse)** cho Sidebar trái kèm hiệu ứng chuyển động mượt mà, lưu trạng thái vào `localStorage` của trình duyệt.
   - Giữ nguyên **Sidebar phải** hiển thị Mục lục TOC dính (sticky) thông minh.
2. **Khu vực Tiêu đề Tài liệu Lớn (Document Title Hero Header):**
   - Bổ sung khu vực Hero Header chuyên biệt ở đầu bài viết với tiêu đề lớn (`2.25rem - 2.5rem` ~ `36px - 40px`), font chữ đậm hiện đại, nổi bật.
   - Hiển thị đầy đủ thanh metadata phụ trợ: thời gian cập nhật gần nhất, huy hiệu lượt xem, danh sách tags nếu có.
   - Cơ chế tự động phát hiện và tối ưu thẻ `h1` đầu tiên trong nội dung Markdown để tránh lặp lại 2 tiêu đề liền kề.
3. **Loại bỏ Padding thừa & Nới rộng không gian đọc:**
   - Gỡ bỏ `padding-top: 40px; padding-bottom: 40px;` và giới hạn `max-width: 758px;` cũ trong `.markdown-body` (từ `markdown.css`).
   - Cột đọc mở rộng tự do (`flex: 1; min-width: 0`), đạt độ rộng tối ưu từ `850px` đến `1150px`, giúp bảng biểu (tables), sơ đồ Mermaid và code block hiển thị thoáng đãng.
4. **Chuẩn hóa Nút bấm dạng Flat (Flat Design Buttons):**
   - Loại bỏ toàn bộ hiệu ứng bóng mờ đổ khối (`box-shadow: none`), loại bỏ gradient màu mè.
   - Định hình phong cách Flat sắc nét: viền mảnh `1px`, màu nền phẳng, bo góc nhẹ `6px`, hiệu ứng hover nhẹ nhàng đổi sắc độ chuẩn phong cách phẳng ban đầu.

### Không thuộc phạm vi (Non-Goals)
- Không can thiệp vào giao diện chế độ soạn thảo (Editor view) hay cấu trúc lưu trữ cơ sở dữ liệu.
- Không thay đổi thuật toán trích xuất TOC (Table of Contents) hiện tại trong `docusaurus-toc.js`.

---

## 2. Chi Tiết Kiến Trúc & Giao Diện

### 2.1. Cấu trúc DOM Bố Cục Mới (`app/public/views/pretty.ejs`)
```html
<header class="docusaurus-navbar">
    <div class="docusaurus-navbar-left">
        <!-- Nút toggle sidebar trái (Flat Icon) -->
        <button type="button" class="docusaurus-sidebar-toggle" id="sidebarToggleBtn" title="Đóng/mở danh sách tài liệu">
            <i class="fa fa-bars"></i>
        </button>
        <a href="<%- serverURL %>/" class="docusaurus-navbar-brand">
            <img src="<%- serverURL %>/icons/apple-touch-icon.png" alt="TechDoc">
            <span>TechDoc</span>
        </a>
        <span class="docusaurus-navbar-separator">/</span>
        <span class="docusaurus-navbar-title"><%= title.replace(/ - TechDoc$/, '') %></span>
    </div>
    <div class="docusaurus-navbar-right">
        <!-- Flat Buttons: Home, Edit, Trash -->
        <a href="<%- serverURL %>/" class="docusaurus-flat-btn docusaurus-flat-btn-default">
            <i class="fa fa-arrow-left"></i> <span>Trang chủ</span>
        </a>
        <a href="#" class="docusaurus-flat-btn docusaurus-flat-btn-primary ui-edit">
            <i class="fa fa-pencil"></i> <span>Chỉnh sửa</span>
        </a>
        <% if (typeof isOwner !== 'undefined' && isOwner) { %>
        <button type="button" class="docusaurus-flat-btn docusaurus-flat-btn-danger ui-trash">
            <i class="fa fa-trash-o"></i> <span>Chuyển vào thùng rác</span>
        </button>
        <% } %>
    </div>
</header>

<div class="docusaurus-layout-wrapper">
    <!-- 1. Left Collapsible Sidebar -->
    <aside id="docusaurusLeftSidebar" class="docusaurus-left-sidebar">
        <div class="sidebar-header">
            <span class="sidebar-title"><i class="fa fa-clock-o"></i> Ghi chú gần đây</span>
            <button type="button" class="sidebar-close-btn" id="sidebarCloseBtn" title="Thu gọn sidebar">
                <i class="fa fa-angle-left"></i>
            </button>
        </div>
        <div class="sidebar-search-box">
            <i class="fa fa-search sidebar-search-icon"></i>
            <input type="text" id="sidebarQuickSearch" class="sidebar-search-input" placeholder="Lọc nhanh ghi chú...">
        </div>
        <div class="sidebar-notes-list" id="sidebarNotesList">
            <!-- Danh sách các ghi chú được render động từ history/API -->
        </div>
    </aside>

    <!-- 2. Main Content Column -->
    <main class="docusaurus-main-content">
        <!-- Document Hero Header -->
        <div class="doc-hero-header">
            <h1 class="doc-hero-title"><%= title.replace(/ - TechDoc$/, '') %></h1>
            <div class="doc-hero-meta">
                <span class="meta-item meta-updated">
                    <i class="fa fa-clock-o"></i> Cập nhật: <span class="ui-updated-text"><%- updatetime ? moment(updatetime).fromNow() : 'Vừa xong' %></span>
                </span>
                <span class="meta-item meta-views">
                    <i class="fa fa-eye"></i> <%- viewcount %> lượt xem
                </span>
            </div>
        </div>

        <!-- Markdown Body (Padding thừa được loại bỏ) -->
        <div id="doc" class="markdown-body" <% if (lang) { %> lang="<%= lang %>"<% } %>><%= body %></div>
    </main>

    <!-- 3. Right Sticky TOC Sidebar -->
    <aside id="docusaurusToc" class="docusaurus-toc-sidebar"></aside>
</div>
```

---

### 2.2. Chi Tiết Kiểu Dáng CSS (`app/public/css/docusaurus-theme.css`)

#### 1. Bố cục Widescreen & Xóa Padding thừa
```css
/* Container rộng toàn diện */
.docusaurus-layout-wrapper {
  display: flex;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 80px;
  gap: 36px;
  transition: all 0.25s ease;
  box-sizing: border-box;
}

/* Xóa bỏ padding 40px thừa và giới hạn max-width cũ của markdown.css */
#doc.markdown-body,
.markdown-body {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
}

.docusaurus-main-content {
  flex: 1;
  min-width: 0;
  width: 100%;
}
```

#### 2. Sidebar Trái (Collapsible Sidebar)
```css
.docusaurus-left-sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  height: calc(100vh - 100px);
  overflow-y: auto;
  border-right: 1px solid var(--ifm-toc-border-color);
  padding-right: 16px;
  transition: width 0.25s ease, margin-left 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
}

/* Trạng thái thu gọn */
.docusaurus-left-sidebar.collapsed {
  width: 0 !important;
  margin-left: -280px !important;
  padding: 0 !important;
  opacity: 0 !important;
  pointer-events: none;
  overflow: hidden;
  border-right: none;
}
```

#### 3. Document Hero Header
```css
.doc-hero-header {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.doc-hero-title {
  font-size: 2.25rem !important; /* ~36px */
  font-weight: 800 !important;
  color: #0f172a !important;
  line-height: 1.25 !important;
  letter-spacing: -0.025em !important;
  margin: 0 0 12px 0 !important;
  border-bottom: none !important;
  padding-bottom: 0 !important;
}

.doc-hero-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #64748b;
}

.doc-hero-meta .meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
```

#### 4. Quy chuẩn Flat Button
```css
.docusaurus-flat-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  box-shadow: none !important; /* Flat */
  text-decoration: none !important;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

/* Default / Outline Flat */
.docusaurus-flat-btn-default {
  background-color: #ffffff;
  border-color: #cbd5e1;
  color: #475569;
}
.docusaurus-flat-btn-default:hover {
  background-color: #f8fafc;
  border-color: #94a3b8;
  color: #1e293b;
}

/* Primary Flat */
.docusaurus-flat-btn-primary {
  background-color: #2563eb;
  border-color: #2563eb;
  color: #ffffff !important;
}
.docusaurus-flat-btn-primary:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

/* Danger Flat */
.docusaurus-flat-btn-danger {
  background-color: #ffffff;
  border-color: #fca5a5;
  color: #dc2626;
}
.docusaurus-flat-btn-danger:hover {
  background-color: #fef2f2;
  border-color: #ef4444;
}

/* Toggle Sidebar Flat Button */
.docusaurus-sidebar-toggle {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 6px 10px;
  color: #475569;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.15s ease;
}
.docusaurus-sidebar-toggle:hover {
  background: #f1f5f9;
  color: #0f172a;
}
```

---

### 2.3. Logic Điều Khiển JavaScript (`app/public/js/pretty.js` & `docusaurus-toc.js`)

1. **Điều khiển Thu gọn / Mở rộng Sidebar:**
   - Đọc trạng thái từ `localStorage.getItem('techdoc_sidebar_collapsed')`. Nếu là `'true'`, gán class `.collapsed` vào sidebar khi tải trang.
   - Lắng nghe sự kiện click trên `#sidebarToggleBtn` và `#sidebarCloseBtn`: toggle class `.collapsed` và lưu lại vào `localStorage`.
2. **Nạp danh sách ghi chú gần đây (Recent Notes):**
   - Đọc danh sách ghi chú đã lưu từ `localStorage.getItem('history')` hoặc API endpoint của ứng dụng.
   - Render danh sách các thẻ liên kết: tiêu đề tài liệu, thời gian, đánh dấu `active` cho tài liệu hiện hành.
   - Hỗ trợ ô `#sidebarQuickSearch` lọc ngay lập tức theo tiêu đề.
3. **Loại bỏ thẻ H1 trùng lặp trong nội dung:**
   - Nếu thẻ heading `h1` đầu tiên trong `#doc` có nội dung text tương đồng (>80% ký tự) với Tiêu đề Hero Header, tự động ẩn thẻ `h1` đó (`display: none`) để giao diện liền mạch, tinh giản.

---

## 3. Kế Hoạch Kiểm Thử (Verification & Testing)

1. **Kiểm tra bố cục màn hình:**
   - Trên màn hình Desktop (1920x1080, 1440p): Layout mở rộng mượt mà đến 1600px, không còn bị co hẹp 900px ở giữa.
   - Padding 40px thừa bị triệt tiêu, nội dung bài viết bắt đầu ngay dưới Hero Header.
2. **Kiểm tra tương tác Sidebar:**
   - Click Toggle: Sidebar đóng/mở êm ái, cột đọc nội dung tự động mở rộng tương ứng.
   - F5 Reload trang: Giữ nguyên trạng thái đã đóng hoặc mở của sidebar.
   - Ô Quick Search: Gõ từ khóa lọc chính xác danh sách ghi chú.
3. **Kiểm tra Hero Header:**
   - Tiêu đề to rõ, sang trọng, đầy đủ thời gian cập nhật và viewcount.
   - Không bị trùng 2 tiêu đề `h1` liên tiếp.
4. **Kiểm tra Nút bấm Flat:**
   - Toàn bộ nút trên navbar và modal không còn đổ bóng, màu sắc phẳng thanh lịch.
