# Thiết Kế Chi Tiết: Chuẩn Hóa TOC & UI Components Theo Phong Cách HackMD Neo

**Tài liệu:** Design Specification  
**Ngày lập:** 2026-09-11  
**Trạng thái:** Approved  
**Phạm vi áp dụng:** Workspace Soạn thảo & Xem tài liệu chính (`techdoc.ejs` / `techdoc/`)  

---

## 1. Bối cảnh & Mục tiêu

### 1.1 Hiện trạng
Giao diện workspace soạn thảo (`techdoc.ejs`) của TechDoc hiện tại vẫn giữ nhiều thành phần Bootstrap 3 cổ điển:
* **Table of Contents (TOC)**: Sử dụng cấu trúc popup dropup cổ điển (`.ui-toc`, `.ui-affix-toc`), vị trí hiển thị chắp vá, thanh chỉ báo cuộn (scrollspy) thiếu ổn định và không tối ưu cho chế độ xem toàn màn hình (View mode) hay chế độ chia đôi (Both mode).
* **Thành phần giao diện (UI Components)**:
  * Navbar có viền dày, đổ bóng và dốc màu (gradient) cũ kỹ.
  * Bộ nút chuyển đổi chế độ (`View / Both / Edit`) sử dụng cụm radio button Bootstrap 3 thô.
  * Thanh thông tin (Infobar) và menu phân quyền (Permission selector) chưa đồng bộ với phong cách thiết kế hiện đại.
  * Các hộp thoại pop-up (Modals) như Import Clipboard/Gist, Delete Note, Locked Note có thiết kế viền nổi dốc, thiếu hiệu ứng nền mờ (backdrop blur) và chưa đạt tiêu chuẩn thẩm mỹ phẳng.
* **Mã nguồn dư thừa (Legacy Debt)**: Nhiều đoạn CSS TOC trong `app/public/css/extra.css` và JS trong `app/public/js/extra.js` bị phân mảnh, trùng lặp và không còn phù hợp.

### 1.2 Mục tiêu dự án
1. **Dọn dẹp mã nguồn thừa (Cleanup)**: Loại bỏ các block CSS và cấu trúc DOM TOC cũ không còn sử dụng trong `extra.css` và `extra.js`.
2. **Xây dựng Module TOC Linh hoạt (Dual-Mode Responsive Engine)**:
   * **View mode**: Cột Sidebar cố định (Sticky Sidebar) ở lề phải bài viết, hỗ trợ phân cấp H1–H4, cuộn mượt (smooth scroll) và thanh chỉ báo vị trí (Active Indicator) bám theo viewport cuộn thông qua `IntersectionObserver`.
   * **Both mode & Màn hình hẹp**: Nút nổi tinh tế (Floating Trigger Pill) ở góc phải khung preview; khi bấm sẽ mở ngăn kéo mờ (Flyout Drawer) chứa mục lục, không che khuất vùng gõ CodeMirror.
3. **Chuẩn hóa hệ thống UI Components theo HackMD Neo**:
   * Xây dựng bộ Design Tokens mới trong `app/public/css/hackmd-neo.css`.
   * Chuẩn hóa Navbar, Segmented Control cho nút chế độ (View/Both/Edit), Infobar, Badges, Buttons (`neo-btn`), Form Inputs và Modals theo phong cách phẳng, tối giản, viền 1px, bo góc 6–8px.
   * Đồng bộ 100% với hệ thống Dark/Light mode hiện hữu.
4. **Bảo toàn tính năng & Ổn định**: Không gây ảnh hưởng tới CodeMirror, Socket.io realtime, phím tắt hoặc tính năng phân quyền note.

---

## 2. Đánh giá & Kế hoạch Dọn dẹp Mã Thừa (Cleanup Audit)

### 2.1 Các thành phần cần loại bỏ
| Tệp | Thành phần thừa | Hành động |
|---|---|---|
| `app/public/views/techdoc/body.ejs` | `.ui-toc.dropup` và `#ui-toc-affix` (dòng 37–46) | Xóa bỏ, thay thế bằng cụm `#neoTocWrapper` |
| `app/public/css/extra.css` | `.ui-toc-dropdown` (dòng 139–290) và `.ui-affix-toc`, `.expand-toggle`, `.back-to-top`, `.go-to-bottom` (dòng 315–340) | Dọn dẹp bỏ các block CSS cũ này |
| `app/public/js/extra.js` | Hàm `generateToc(id)` cũ dựa trên `window.Toc` và `checkExpandToggle()` | Vô hiệu hóa / gỡ bỏ lời gọi tới TOC cũ, tích hợp `techdoc-toc.js` mới |

---

## 3. Kiến trúc Kỹ thuật

### 3.1 Cấu trúc Module Mới
```
app/public/
├── css/
│   └── hackmd-neo.css            # Design Tokens & UI Styles chuẩn hóa (Navbar, Controls, Modals, Buttons, TOC)
├── js/
│   └── techdoc-toc.js            # Engine TOC thông minh (Sticky Sidebar + Floating Drawer, Scrollspy)
└── views/techdoc/
    ├── head.ejs                  # Nạp hackmd-neo.css
    ├── header.ejs                # Chuẩn hóa Navbar & Segmented Mode Switcher
    ├── body.ejs                  # Cập nhật Infobar, tích hợp #neoTocWrapper
    └── footer.ejs                # Nạp techdoc-toc.js
```

---

## 4. Chi Tiết Thiết Kế Thành Phần (Component Design)

### 4.1 Component Mục Lục Linh Hoạt (`techdoc-toc.js`)

#### 4.1.1 Cấu trúc DOM (`neoTocWrapper`)
Nằm trong `.ui-view-area` của `body.ejs`:
```html
<div id="neoTocWrapper" class="neo-toc-wrapper">
    <!-- View Mode: Sticky Sidebar -->
    <aside id="neoTocSidebar" class="neo-toc-sidebar" aria-label="Mục lục bài viết">
        <div class="neo-toc-header">
            <span class="neo-toc-title">MỤC LỤC</span>
            <button type="button" class="neo-toc-action-btn neo-toc-expand-toggle" title="Mở rộng / Thu gọn">
                <i class="fa fa-angle-double-down"></i>
            </button>
        </div>
        <nav class="neo-toc-nav" id="neoTocContentSidebar"></nav>
    </aside>

    <!-- Both Mode & Màn hình nhỏ: Floating Trigger & Drawer -->
    <div id="neoTocFloating" class="neo-toc-floating">
        <button type="button" class="neo-toc-trigger-btn" id="neoTocTriggerBtn" title="Xem mục lục">
            <i class="fa fa-list-ul"></i>
            <span class="neo-toc-trigger-label">Mục lục</span>
        </button>
        <div class="neo-toc-drawer" id="neoTocDrawer">
            <div class="neo-toc-drawer-header">
                <span class="neo-toc-title">MỤC LỤC</span>
                <button type="button" class="neo-toc-close-btn" id="neoTocCloseBtn" title="Đóng">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            <nav class="neo-toc-nav" id="neoTocContentDrawer"></nav>
        </div>
    </div>
</div>
```

#### 4.1.2 Nguyên lý Hoạt động & Thuật toán
1. **Trích xuất Heading**: Quét toàn bộ thẻ `h1, h2, h3, h4` trong `#doc`. Tự động tạo slug an toàn cho các heading chưa có ID.
2. **Phân cấp Thụt lề**:
   * H1/H2: Cấp gốc (Level 1/2), font chữ đậm nét vừa, lề trái 10px.
   * H3: Cấp phụ (Level 3), font nhỏ hơn, lề trái 22px.
   * H4: Cấp chi tiết (Level 4), lề trái 34px.
3. **Scrollspy bằng `IntersectionObserver`**:
   * Cấu hình `rootMargin: '0px 0px -65% 0px'`.
   * Tiêu đề nào chạm vào vùng quan sát sẽ nhận class `.active`.
   * Thanh chỉ báo Active Indicator dạng vạch đứng trượt mượt mà theo mục đang đọc.
4. **Chuyển đổi Trạng thái theo Mode**:
   * Lắng nghe sự kiện đổi mode (`ui-view`, `ui-both`, `ui-edit`) và resize cửa sổ.
   * Khi ở `View mode` trên màn hình rộng: Bật Sidebar, ẩn Floating button.
   * Khi ở `Both mode` hoặc màn hình hẹp: Ẩn Sidebar, bật Floating button.
   * Khi ở `Edit mode`: Ẩn toàn bộ TOC.
   * Nếu bài viết có ít hơn 2 tiêu đề: Tự động ẩn TOC.
5. **Cập nhật Thời gian Thực (Realtime DOM Observer)**:
   * Lắng nghe thay đổi cây DOM của `#doc` với cơ chế debounce 300ms, tự làm mới danh sách mục lục khi người dùng đang gõ bài.

---

### 4.2 Hệ Thống UI Components HackMD Neo (`hackmd-neo.css`)

#### 4.2.1 Bảng Design Tokens
```css
:root, [data-theme='light'] {
    --neo-bg-default: #ffffff;
    --neo-bg-surface: #f8fafc;
    --neo-bg-subtle: #f1f5f9;
    --neo-border-default: #e2e8f0;
    --neo-border-subtle: #cbd5e1;
    --neo-text-default: #0f172a;
    --neo-text-subtle: #64748b;
    --neo-primary: #2563eb;
    --neo-primary-hover: #1d4ed8;
    --neo-danger: #ef4444;
    --neo-radius-sm: 4px;
    --neo-radius-md: 6px;
    --neo-radius-lg: 8px;
    --neo-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --neo-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
}

[data-theme='dark'], body.night, .night {
    --neo-bg-default: #121314;
    --neo-bg-surface: #1e1f21;
    --neo-bg-subtle: #242526;
    --neo-border-default: #2e3035;
    --neo-border-subtle: #3f4248;
    --neo-text-default: #f1f5f9;
    --neo-text-subtle: #94a3b8;
    --neo-primary: #38bdf8;
    --neo-primary-hover: #60a5fa;
    --neo-danger: #ef4444;
    --neo-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --neo-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
}
```

#### 4.2.2 Chuẩn Hóa Navbar & Segmented Mode Switcher
* **Navbar**: Viền dưới 1px `var(--neo-border-default)`, chiều cao 56px, nền `var(--neo-bg-default)`.
* **Segmented Mode Switcher**:
  * Container nền `var(--neo-bg-subtle)`, đệm 3px, bo góc 6px.
  * Mỗi nút (View / Both / Edit) có icon rõ ràng, padding 6px 14px.
  * Nút được chọn (active) có nền `var(--neo-bg-default)`, chữ `var(--neo-primary)`, viền bóng nhẹ `var(--neo-shadow-sm)`.

#### 4.2.3 Chuẩn Hóa Infobar & Permission Selector
* **Infobar**: Nền trong suốt hoặc bề mặt phẳng nhẹ, hiển thị thời gian cập nhật/tạo và avatar tác giả dạng hình tròn gọn gàng.
* **Permission Selector**: Nút chọn quyền dạng Flat Badge có viền 1px, hiển thị icon tương ứng với quyền sở hữu (Freely, Editable, Limited, Locked, Private). Menu thả xuống bo góc 6px, bóng đổ `var(--neo-shadow-md)`, hover êm ái.

#### 4.2.4 Chuẩn Hóa Nút Bấm (`neo-btn`) & Modals
* **Nút bấm (`neo-btn`)**:
  * `.neo-btn`: Chiều cao chuẩn 36px (nhỏ: 30px), font-weight 500, bo góc 6px, transition 0.15s.
  * `.neo-btn-primary`: Nền `var(--neo-primary)`, chữ trắng.
  * `.neo-btn-tertiary`: Viền `var(--neo-border-default)`, nền `var(--neo-bg-default)`.
  * `.neo-btn-danger`: Màu đỏ cảnh báo phẳng.
* **Modals**:
  * Hộp thoại dạng card nổi phẳng, góc bo 8px, viền 1px `var(--neo-border-default)`.
  * Hiệu ứng nền backdrop làm mờ kính: `backdrop-filter: blur(4px)`.
  * Header phẳng phân cách viền mảnh, footer căn phải các nút `.neo-btn`.

---

## 5. Kế Hoạch Kiểm Thử (Test Scenarios)

1. **Kiểm tra TOC ở Chế độ Xem (View Mode)**:
   * Chuyển sang View mode (`Ctrl+Alt+V`): TOC hiển thị dạng Sticky Sidebar bên phải.
   * Cuộn bài viết: Vạch màu active di chuyển chính xác theo từng heading.
   * Bấm vào mục con H3: Trang cuộn mượt mà đến đúng vị trí mà không bị lệch vị trí do header che khuất.
2. **Kiểm tra TOC ở Chế độ Song Song (Both Mode)**:
   * Chuyển sang Both mode (`Ctrl+Alt+B`): Sidebar ẩn đi; nút Floating Trigger hiện ở góc phải preview.
   * Bấm nút mở Drawer: Danh sách mục lục trượt ra; bấm ngoài vùng drawer hoặc bấm nút X để đóng.
3. **Kiểm tra Cập nhật Thời gian Thực (Realtime Sync)**:
   * Gõ thêm heading mới `# Tiêu đề mới`: Sau 300ms, mục mới xuất hiện ngay trên TOC mà không cần tải lại trang.
4. **Kiểm tra Giao diện & Đổi Theme (Dark/Light)**:
   * Bấm nút đổi theme: Kiểm tra Navbar, Mode Switcher, Infobar, TOC Sidebar/Drawer và Modals đổi màu chuẩn xác, không còn phần tử nào bị lộ màu Bootstrap cũ.
5. **Kiểm tra Bảo toàn Chức năng**:
   * Kiểm tra CodeMirror không bị ảnh hưởng chiều cao/cuộn.
   * Kiểm tra phím tắt `Ctrl+Alt+V`, `Ctrl+Alt+B`, `Ctrl+Alt+E`, `Ctrl+F`.
