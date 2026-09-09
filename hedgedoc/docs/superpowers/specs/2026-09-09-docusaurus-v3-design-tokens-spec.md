# Đặc tả thiết kế: Chuẩn hóa Hệ thống Design Tokens & Typography theo Docusaurus v3

**Ngày lập:** 2026-09-09  
**Trạng thái:** Chờ phê duyệt (Pending Approval)  
**Tài liệu tham chiếu:** `https://docusaurus.io/docs` (Infima CSS Design System)

---

## 1. Bối cảnh & Mục tiêu

Nhằm mang lại trải nghiệm đọc tài liệu hiện đại, rõ ràng, thẩm mỹ cao và chuẩn mực như `docusaurus.io/docs`, giao diện hiển thị tài liệu của HedgeDoc (`pretty.ejs` và khung preview `hedgedoc/head.ejs`) cần được chuẩn hóa toàn diện theo hệ thống Design Tokens và quy tắc typography của Docusaurus v3 (sử dụng framework Infima).

Mục tiêu chính:
1. Chuẩn hóa bộ phông chữ hệ thống đa nền tảng và phông monospace theo Docusaurus.
2. Thiết lập đúng tỷ lệ phân cấp typography: Body `16.5px`, line-height `1.65`, màu chữ xám than `#1c1e21`, tiêu đề `h1` (40px), `h2` (32px có đường phân cách), `h3` (24px).
3. Hỗ trợ trọn bộ 5 loại Admonitions (Callout boxes: Note, Tip, Info, Warning, Danger) với phong cách pastel viền màu Infima.
4. Bảng biểu dạng thẻ tinh tế bo tròn góc `8px`, tiêu đề xám nhạt `#f6f8fa`, viền `#ebedf0`.
5. Thanh mục lục (Sticky TOC) chuẩn Docusaurus: font `14px`, viền mờ `#ebedf0`, highlight mượt mà theo vị trí cuộn trang.

---

## 2. Hệ thống Design Tokens (`:root` / CSS Custom Properties)

Tập trung toàn bộ biến thiết kế trong `docusaurus-theme.css`:

```css
:root {
  /* Phông chữ */
  --ifm-font-family-base: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  --ifm-font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  
  /* Cỡ chữ & Giãn dòng */
  --ifm-font-size-base: 16.5px;
  --ifm-line-height-base: 1.65;
  --ifm-leading: 1.25rem; /* 20px */
  
  /* Màu sắc chủ đạo */
  --ifm-color-content: #1c1e21;
  --ifm-color-content-secondary: #525860;
  --ifm-color-primary: #2563eb;
  --ifm-color-primary-dark: #1d4ed8;
  --ifm-background-color: #ffffff;
  
  /* Tiêu đề Headings */
  --ifm-h1-font-size: 2.5rem;   /* 40px */
  --ifm-h2-font-size: 2.0rem;   /* 32px */
  --ifm-h3-font-size: 1.5rem;   /* 24px */
  --ifm-h4-font-size: 1.25rem;  /* 20px */
  --ifm-heading-color: #0f172a;
  
  /* Khối chú thích Admonition */
  --ifm-alert-note-border: #2563eb;
  --ifm-alert-note-bg: #eff6ff;
  --ifm-alert-note-text: #1e40af;
  
  --ifm-alert-tip-border: #00a400;
  --ifm-alert-tip-bg: #e6f6e6;
  --ifm-alert-tip-text: #004d00;
  
  --ifm-alert-info-border: #54c7ec;
  --ifm-alert-info-bg: #eef9fd;
  --ifm-alert-info-text: #0b4c63;
  
  --ifm-alert-warning-border: #ffba00;
  --ifm-alert-warning-bg: #fff9e6;
  --ifm-alert-warning-text: #664a00;
  
  --ifm-alert-danger-border: #fa383e;
  --ifm-alert-danger-bg: #ffebec;
  --ifm-alert-danger-text: #641719;
  
  /* Bảng biểu & Mục lục */
  --ifm-table-border-color: #ebedf0;
  --ifm-table-head-background: #f6f8fa;
  --ifm-toc-border-color: #ebedf0;
  --ifm-toc-link-color: #525860;
  --ifm-toc-link-active: #2563eb;
}
```

---

## 3. Đặc tả Chi tiết các Thành phần Giao diện

### 3.1. Typography & Khối Văn Bản
- `body.docusaurus-layout`: Áp dụng `--ifm-font-family-base`, `--ifm-font-size-base`, `--ifm-line-height-base`, `--ifm-color-content`, loại bỏ mọi hiệu ứng đổ bóng mờ chữ (`text-shadow: none`).
- Đoạn văn (`p`): Kích thước `16.5px`, khoảng cách lề dưới `margin-bottom: var(--ifm-leading)`.
- Danh sách (`ul, ol`): Thụt lề `padding-left: 1.75rem`, khoảng cách dòng thoáng, `li` có `margin-bottom: 0.25rem`.
- Tiêu đề:
  - `h1`: Đậm `700`, cỡ `2.5rem`, `letter-spacing: -0.02em`, `margin-bottom: 1.5rem`.
  - `h2`: Đậm `700`, cỡ `2.0rem`, có viền chân `border-bottom: 1px solid var(--ifm-toc-border-color)`, `padding-bottom: 0.35rem`, `margin-top: 2.5rem`.
  - `h3`: Bán đậm `600`, cỡ `1.5rem`, `margin-top: 2.0rem`.

### 3.2. Admonitions / Callout Boxes
Hỗ trợ cả cú pháp `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!DANGER]`, `> [!INFO]` và khối `blockquote` thông thường:
- Viền trái `4px solid`, góc phải bo nhẹ `border-radius: 0 8px 8px 0`, đệm `padding: 14px 18px`.
- Nền pastel nhẹ nhàng dịu mắt, độ tương phản văn bản cao, đạt chuẩn trợ năng WCAG AA.

### 3.3. Bảng Biểu (Tables)
- Định dạng: `display: table; width: 100%; border-collapse: separate; border-spacing: 0;`.
- Viền bao: `1px solid var(--ifm-table-border-color)`, bo góc `8px`.
- Tiêu đề cột (`th`): Nền `--ifm-table-head-background` (`#f6f8fa`), đậm `600`, đệm lót `12px 16px`, đường kẻ chân `2px solid var(--ifm-table-border-color)`.
- Ô dữ liệu (`td`): Chữ `16px`, đệm lót `12px 16px`, đường kẻ ngăn `1px solid var(--ifm-table-border-color)`.
- Ảnh trong ô bảng: Giới hạn chiều cao tối đa `max-height: 200px`, bo góc nhẹ, căn giữa ô.

### 3.4. Khối Mã Nguồn (Code Blocks)
- Khối mã (`pre`): Nền tối `#1e1e2e` / Prism Dark, bo góc `8px`, padding `18px 22px`, bóng mờ tinh tế.
- Mã nội dòng (`code`): Nền `#f1f5f9`, viền `1px solid #e2e8f0`, chữ đỏ hồng `#e11d48`, cỡ `88%`, bo góc `4px`, padding `2px 6px`.

### 3.5. Bố cục 2 Cột & Thanh Mục Lục Dính (Sticky TOC)
- Thanh Header: Chiều cao `60px`, nền trắng `#ffffff`, viền dưới `#ebedf0`, nút bấm bo góc hiện đại.
- Cột đọc: Chiều rộng tối đa `840px`.
- Cột TOC: Rộng `240px`, dính `top: 80px`, viền trái `1px solid var(--ifm-toc-border-color)`.
- Tiêu đề TOC: `MỤC LỤC NỘI DUNG` (in hoa, cỡ `12px`, giãn chữ `0.8px`).
- Liên kết TOC: Cỡ `14px` (`0.875rem`), màu `#525860`. Khi cuộn tới phần tương ứng, chuyển màu `#2563eb`, đậm `600` và có thanh chỉ báo bên trái `border-left: 2px solid #2563eb`.

---

## 4. Kế hoạch Kiểm thử & Xác minh

1. Kiểm tra tải CSS và tính hợp lệ của cú pháp Design Tokens trong trình duyệt.
2. Kiểm tra hiển thị tiêu đề `h1`, `h2` (kèm đường kẻ), `h3` đúng tỷ lệ Docusaurus.
3. Kiểm tra các hộp callout chú thích và bảng biểu bo tròn đẹp mắt.
4. Kiểm tra scrollspy mục lục bên phải nhạy bén khi cuộn trang.
5. Kiểm tra chạy thành công 5 bộ test tự động hiện có của dự án.
