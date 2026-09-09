# Kế Hoạch Triển Khai: Xóa Bỏ Nhận Diện HedgeDoc & Rebranding Sang TechDoc

- **Tài liệu thiết kế:** [2026-09-09-unbrand-hedgedoc-to-techdoc-design.md](file:///home/lamnh/projects/techdoc/docs/superpowers/specs/2026-09-09-unbrand-hedgedoc-to-techdoc-design.md)
- **Ngày tạo:** 2026-09-09
- **Trạng thái:** Sẵn sàng thực thi (Ready to Execute)

---

## Giai đoạn 1: Đổi Tên Thư Mục & Tệp Tin Cốt Lõi

### Bước 1.1: Đổi tên thư mục gốc của ứng dụng
- **Mục tiêu:** Chuyển `hedgedoc/` thành `app/` thông qua git để bảo toàn lịch sử commit.
- **Lệnh thực thi:**
  ```bash
  git mv hedgedoc app
  ```

### Bước 1.2: Đổi tên thư mục views và tệp tin template chính
- **Mục tiêu:**
  - `app/public/views/hedgedoc/` $\rightarrow$ `app/public/views/techdoc/`
  - `app/public/views/hedgedoc.ejs` $\rightarrow$ `app/public/views/techdoc.ejs`
- **Lệnh thực thi:**
  ```bash
  git mv app/public/views/hedgedoc app/public/views/techdoc
  git mv app/public/views/hedgedoc.ejs app/public/views/techdoc.ejs
  ```

### Bước 1.3: Đổi tên middleware phiên bản
- **Mục tiêu:**
  - `app/lib/web/middleware/hedgeDocVersion.js` $\rightarrow$ `app/lib/web/middleware/techDocVersion.js`
- **Lệnh thực thi:**
  ```bash
  git mv app/lib/web/middleware/hedgeDocVersion.js app/lib/web/middleware/techDocVersion.js
  ```

---

## Giai đoạn 2: Cập Nhật Tham Chiếu Mã Nguồn & Docker Cấu Hình

### Bước 2.1: Cập nhật controller và các views include
- **Tệp cần sửa:**
  1. `app/lib/web/note/controller.js`:
     - Sửa `res.render('hedgedoc.ejs', ...)` thành `res.render('techdoc.ejs', ...)`.
  2. `app/public/views/techdoc.ejs`:
     - Cập nhật các include: `include('techdoc/head')`, `include('techdoc/header')`, `include('techdoc/body')`, `include('techdoc/footer')`.
  3. `app/public/views/error.ejs`:
     - Cập nhật include: `include('techdoc/head')`, `include('techdoc/header')`.
  4. `app/public/views/link.ejs`:
     - Cập nhật include: `include('techdoc/head')`, `include('techdoc/header')`.
     - Cập nhật thông báo: thay "HedgeDoc" thành "TechDoc".
  5. `app/app.js`:
     - Sửa require middleware: `require('./lib/web/middleware/techDocVersion')`.

### Bước 2.2: Cập nhật file cấu hình `docker-compose.yml`
- **Tệp cần sửa:** `docker-compose.yml`
- **Nội dung cập nhật:**
  - `build: ./app` (thay vì `./hedgedoc`)
  - `image: techdoc-local:latest`
  - Mount volumes: `./app/lib:...`, `./app/public:...`
  - Database environment:
    ```yaml
    services:
      database:
        environment:
          - POSTGRES_USER=techdoc
          - POSTGRES_PASSWORD=password
          - POSTGRES_DB=techdoc
      app:
        environment:
          - CMD_DB_URL=postgres://techdoc:password@database:5432/techdoc
    ```

---

## Giai đoạn 3: Backend Logic, HTTP Headers & Metrics

### Bước 3.1: Middleware HTTP Response Header
- **Tệp cần sửa:** `app/lib/web/middleware/techDocVersion.js`
- **Nội dung:** Đổi header gửi về từ `HedgeDoc-Version` thành `TechDoc-Version`.

### Bước 3.2: User-Agent & Note Titles
- **Tệp cần sửa:**
  1. `app/lib/response.js`: Đổi `User-Agent: 'HedgeDoc'` $\rightarrow$ `'TechDoc'`.
  2. `app/lib/models/note.js`:
     - Tiêu đề mặc định: `'TechDoc - Collaborative markdown notes'`.
     - Hậu tố tiêu đề: `title + ' - TechDoc'`.
  3. `app/public/js/extra.js`:
     - Tiêu đề client-side: `title += ' - TechDoc'` và `title = 'TechDoc - Collaborative markdown notes'`.
  4. `app/public/js/cover.js`:
     - Đổi tên file export lịch sử: `techdoc_history_...`.

### Bước 3.3: Prometheus Metrics
- **Tệp cần sửa:** `app/lib/prometheus.js`
- **Nội dung:** Đổi tên metrics từ `hedgedoc_*` $\rightarrow$ `techdoc_*`.

---

## Giai đoạn 4: Thiết Kế Bộ Nhận Diện Đồ Họa (Assets)

### Bước 4.1: Tạo các banner SVG mới cho TechDoc
- **Vị trí:**
  1. `app/public/banner/banner_h_bw.svg`: Banner ngang TechDoc cho Light theme (chữ xám đậm, icon TechDoc xanh `#2563eb`).
  2. `app/public/banner/banner_h_wb.svg`: Banner ngang TechDoc cho Dark theme (chữ trắng sáng, icon TechDoc xanh `#38bdf8`).
  3. `app/public/banner/banner_vertical_color.svg`: Banner đứng TechDoc với logo và slogan.

### Bước 4.2: Cập nhật Favicon & Apple Touch Icon
- **Vị trí:**
  1. `app/public/icons/favicon.svg`: Icon TechDoc vector sắc nét.
  2. `app/public/icons/apple-touch-icon.png`: Icon vuông bo góc hiện đại.

---

## Giai đoạn 5: Chuẩn Hóa Giao Diện Người Dùng (UI Views)

### Bước 5.1: Trang Portal (`app/public/views/index/`)
1. `app/public/views/index/head.ejs`:
   - Title & OpenGraph meta tags: thay toàn bộ bằng TechDoc.
2. `app/public/views/index/body.ejs`:
   - Logo chính: alt="TechDoc".
   - **Footer 100% width:** Mở rộng toàn màn hình (`width: 100%`), đổi sang bản quyền TechDoc, xóa các liên kết HedgeDoc Releases / Source Code.

### Bước 5.2: Header & Navbar (`app/public/views/techdoc/header.ejs`)
- Cập nhật `title="TechDoc"`, `alt="TechDoc"`.

### Bước 5.3: Trang Đăng Nhập (`app/public/views/login.ejs`)
- Tiêu đề trang: `Đăng nhập & Đăng ký - TechDoc`.
- Logo login: `alt="TechDoc"`.

### Bước 5.4: Trình Xem Tài Liệu (`app/public/views/pretty.ejs`)
- Navbar brand: `<span>TechDoc</span>`.
- Regex bỏ hậu tố: `title.replace(/ - TechDoc$/, '')`.
- Logo và OpenGraph tags.

### Bước 5.5: Dọn dẹp Modal Trợ Giúp (`app/public/views/shared/help-modal.ejs`)
- Gỡ bỏ hoàn toàn các liên kết ngoài tới `community.hedgedoc.org`, `chat.hedgedoc.org`, GitHub issues, `translate.hedgedoc.org`.

---

## Giai đoạn 6: Kiểm Tra Cơ Sở Dữ Liệu & Khởi Chạy

### Bước 6.1: Script kiểm tra tương thích Database
- Kiểm tra xem volume `./data/database` đã tồn tại dữ liệu với user `hedgedoc` chưa.
- Nếu có, cấu hình role alias hoặc khởi tạo migration chuyển role an toàn.

### Bước 6.2: Kiểm tra tổng thể (Verification & Testing)
1. **Ripgrep:** Quét toàn bộ `app/public/views` và `app/lib` để đảm bảo không còn chuỗi `HedgeDoc` hiển thị ra client.
2. **Curl Header:** Gửi HTTP request kiểm tra không còn header `HedgeDoc-Version`.
3. **Trình duyệt:** Kiểm tra portal, footer 100% width, login page, pretty doc page.
