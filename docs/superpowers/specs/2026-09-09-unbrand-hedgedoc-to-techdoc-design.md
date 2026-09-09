# Thiết Kế Kỹ Thuật: Xóa Bỏ Nhận Diện HedgeDoc & Rebranding Sang TechDoc

- **Ngày tạo:** 2026-09-09
- **Trạng thái:** Chờ phê duyệt (Ready for Review)
- **Mục tiêu:** Xóa bỏ toàn bộ các dấu hiệu nhận biết của HedgeDoc trong mã nguồn và giao diện, thay thế bằng bộ nhận diện thương hiệu **TechDoc** hiện đại, đồng bộ từ thư mục mã nguồn, tệp tin cấu hình, Docker, HTTP headers tới toàn bộ giao diện người dùng.

---

## 1. Mục Tiêu (Goals & Non-Goals)

### Mục tiêu (Goals)
1. **Thư mục & Tệp tin:**
   - Đổi tên thư mục gốc `hedgedoc/` thành `app/`.
   - Đổi tên thư mục view `app/public/views/hedgedoc/` thành `app/public/views/techdoc/`.
   - Đổi tên tệp `hedgedoc.ejs` thành `techdoc.ejs` và cập nhật các controller/view gọi tới.
   - Đổi tên middleware `hedgeDocVersion.js` thành `techDocVersion.js`.
2. **Giao diện & Assets (UI & Branding):**
   - Thiết kế mới bộ banner/logo SVG (Light & Dark) mang tên TechDoc: `banner_h_bw.svg`, `banner_h_wb.svg`, `banner_vertical_color.svg`.
   - Cập nhật favicon và `apple-touch-icon.png` đồng bộ nhận diện TechDoc.
   - Thay thế toàn bộ chữ "HedgeDoc" trên thanh điều hướng (Navbar), trang chủ (Portal), trang đăng nhập (`login.ejs`), và trang xem tài liệu (`pretty.ejs`).
   - Tinh chỉnh Footer trên trang chủ/portal: mở rộng toàn màn hình (`width: 100%`), thay "Powered by HedgeDoc" thành "TechDoc", loại bỏ các link ngoài (`Releases`, `Source Code` trỏ về HedgeDoc gốc).
   - Dọn dẹp Help Modal (`help-modal.ejs`): xóa các link cộng đồng bên ngoài (`community.hedgedoc.org`, Matrix chat, translation, GitHub issues).
3. **Backend & HTTP Headers:**
   - Đổi header HTTP `HedgeDoc-Version` thành `TechDoc-Version` (hoặc loại bỏ header tiết lộ phiên bản).
   - Đổi `User-Agent: 'HedgeDoc'` thành `'TechDoc'` trong outbound HTTP requests (`lib/response.js`).
   - Cập nhật định dạng tiêu đề trang tự sinh: `[Tên ghi chú] - TechDoc` và tiêu đề mặc định `TechDoc - Collaborative markdown notes`.
   - Đổi tên các metric Prometheus từ `hedgedoc_*` thành `techdoc_*`.
4. **Hạ tầng & Docker:**
   - Cập nhật `docker-compose.yml`: build từ `./app`, đổi tên image thành `techdoc-local:latest`.
   - Đổi database user và database name sang `techdoc` (hỗ trợ migration an toàn cho volume database hiện hữu).

### Không thuộc phạm vi (Non-Goals)
- Không viết lại kiến trúc core OT (Operational Transformation) hay thay thế các thư viện editor bên thứ ba (như `@hedgedoc/codemirror-5` trong `package.json` vì chỉ dùng nội bộ lúc compile bundle webpack).
- Không phá vỡ cấu trúc dữ liệu các bảng note trong PostgreSQL.

---

## 2. Chi Tiết Kiến Trúc & Thay Đổi

### 2.1. Cấu trúc Thư mục & Mã Nguồn
```text
techdoc/
├── docker-compose.yml              # Cập nhật build context, image, env DB
├── data/
│   ├── database/
│   └── uploads/
└── app/                            # Đổi từ hedgedoc/
    ├── app.js                      # Cập nhật require middleware version
    ├── Dockerfile
    ├── lib/
    │   ├── prometheus.js           # Prefix metrics: techdoc_*
    │   ├── response.js             # User-Agent: TechDoc
    │   ├── models/note.js          # Title suffix: - TechDoc
    │   └── web/
    │       ├── note/controller.js  # Render techdoc.ejs thay vì hedgedoc.ejs
    │       └── middleware/
    │           └── techDocVersion.js # Đổi từ hedgeDocVersion.js
    └── public/
        ├── banner/                 # Bộ SVG banner mới của TechDoc
        ├── icons/                  # Bộ favicon / apple-touch-icon mới
        ├── js/
        │   └── extra.js            # Client-side title suffix: - TechDoc
        └── views/
            ├── techdoc.ejs         # Đổi từ hedgedoc.ejs
            ├── techdoc/            # Đổi từ hedgedoc/
            │   ├── head.ejs
            │   ├── header.ejs
            │   ├── body.ejs
            │   └── footer.ejs
            ├── index/
            │   ├── head.ejs        # Title & OpenGraph TechDoc
            │   └── body.ejs        # Logo TechDoc, Footer 100% width
            ├── login.ejs           # Title & Logo TechDoc
            ├── pretty.ejs          # Title & Logo TechDoc
            ├── link.ejs            # Nội dung cảnh báo link TechDoc
            ├── error.ejs           # Include techdoc/head & techdoc/header
            └── shared/
                └── help-modal.ejs  # Bỏ links ra cộng đồng hedgedoc
```

---

### 2.2. Giao diện & Đồ họa (Assets & UI)

#### 1. SVG Assets (`app/public/banner/` & `app/public/icons/`):
- `banner_h_bw.svg`: Logo ngang hiện đại màu tối (cho nền sáng) với chữ **TechDoc** và icon tài liệu xanh dương (`#2563eb`).
- `banner_h_wb.svg`: Logo ngang hiện đại màu sáng (cho nền tối) với chữ **TechDoc** và icon tài liệu xanh dương (`#38bdf8`).
- `banner_vertical_color.svg`: Logo dạng đứng cho trang chủ/portal.
- `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`: Biểu tượng hình vuông bo góc hiện đại của TechDoc.

#### 2. Footer Portal (`app/public/views/index/body.ejs`):
- Mở rộng toàn màn hình (`width: 100%; max-width: 100%; box-sizing: border-box;`).
- Giao diện tối giản:
  ```html
  <footer class="mastfoot" style="background: #ffffff; border-top: 1px solid #e2e8f0; padding: 24px 0; text-align: center; color: #64748b; font-size: 13px; width: 100%; left: 0;">
      <div class="inner">
          <p>© 2026 TechDoc - Nền tảng ghi chú & tài liệu kỹ thuật</p>
      </div>
  </footer>
  ```

#### 3. Modal Trợ giúp (`app/public/views/shared/help-modal.ejs`):
- Xóa các liên kết dẫn đến `community.hedgedoc.org`, `chat.hedgedoc.org`, Matrix, dịch thuật cộng đồng.
- Giữ lại danh sách phím tắt hữu ích và hướng dẫn cú pháp Markdown.

---

### 2.3. Backend Logic & Headers

1. **Middleware HTTP Header (`app/lib/web/middleware/techDocVersion.js`):**
   ```javascript
   'use strict'
   const config = require('../../config')

   module.exports = function (req, res, next) {
     res.header({
       'TechDoc-Version': config.version
     })
     next()
   }
   ```
2. **Outbound User-Agent (`app/lib/response.js`):**
   - Đổi `'User-Agent': 'HedgeDoc'` $\rightarrow$ `'User-Agent': 'TechDoc'`.
3. **Tiêu đề mặc định (`app/lib/models/note.js` & `app/public/js/extra.js`):**
   - `TechDoc - Collaborative markdown notes`.
   - Hậu tố: `title + ' - TechDoc'`.

---

### 2.4. Cấu hình Docker & Cơ sở Dữ Liệu (`docker-compose.yml`)

1. **Docker Service App:**
   ```yaml
   app:
     build: ./app
     image: techdoc-local:latest
     environment:
       - CMD_DB_URL=postgres://techdoc:password@database:5432/techdoc
       - CMD_DOMAIN=localhost
       - CMD_URL_ADDPORT=true
       - CMD_TOOBUSY_LAG=10000
       - CMD_SESSION_SECRET=3b435609ac22c2926a934aec7a532ad1cb9df0f2e6a27d8f552205a0147e52a5
     volumes:
       - ./app/lib:/hedgedoc/lib:ro
       - ./app/public:/hedgedoc/public
       - ./data/uploads:/hedgedoc/public/uploads
     ports:
       - "3000:3000"
     restart: always
     depends_on:
       - database
   ```
2. **PostgreSQL Service & Tương thích dữ liệu cũ:**
   - Cấu hình mới: `POSTGRES_USER=techdoc`, `POSTGRES_DB=techdoc`.
   - **Xử lý tương thích (Migration check):** Nếu database đã được tạo trước đó với user/db `hedgedoc`, PostgreSQL sẽ không tự động tạo user mới khi khởi động lại volume `./data/database`. Chúng ta sẽ bổ sung một script nhỏ hoặc kiểm tra kết nối để tạo role/database alias nếu cần, đảm bảo hệ thống kết nối thành công và không gián đoạn dữ liệu.

---

## 3. Kế Hoạch Kiểm Thử (Verification & Testing)

1. **Kiểm tra cú pháp & File system:**
   - Kiểm tra các đường dẫn `git status` sau khi đổi tên thư mục và tệp tin.
   - Đảm bảo tất cả các câu lệnh `include('hedgedoc/...')` được cập nhật thành `include('techdoc/...')`.
2. **Kiểm tra tìm kiếm từ khóa:**
   - Chạy ripgrep toàn bộ thư mục `app/public/views` và `app/lib` để xác nhận không còn từ khóa hiển thị `HedgeDoc` ra ngoài client.
3. **Kiểm tra hiển thị giao diện:**
   - Header/Navbar hiển thị logo TechDoc và tiêu đề TechDoc.
   - Footer mở rộng 100% bề ngang, hiển thị bản quyền TechDoc.
   - Trang login và trang pretty view hiển thị logo và tiêu đề TechDoc.
4. **Kiểm tra HTTP Response:**
   - `curl -I http://localhost:3000` kiểm tra header: xác nhận không còn `HedgeDoc-Version`, kiểm tra `TechDoc-Version` (hoặc ẩn hoàn toàn).
