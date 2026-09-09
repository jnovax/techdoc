# Kế Hoạch Triển Khai: Hiện Đại Hóa Hạ Tầng Build với Rspack, SWC và LightningCSS

- **Tài liệu thiết kế:** [2026-09-09-modernized-build-infrastructure-rspack-design.md](file:///home/lamnh/projects/techdoc/docs/superpowers/specs/2026-09-09-modernized-build-infrastructure-rspack-design.md)
- **Ngày tạo:** 2026-09-09
- **Trạng thái:** Sẵn sàng thực thi (Ready to Execute)

---

## Giai đoạn 1: Xây Dựng Hệ Thống Cấu Hình Rspack 1.x & Tối Ưu Package.json

### Bước 1.1: Tạo `app/rspack.common.js`
- **Mục tiêu:**
  - Thiết lập cấu hình nền tảng bằng `@rspack/core`.
  - Định nghĩa 8 entry points chính (`font-pack`, `common`, `cover`, `cover-styles-pack`, `cover-pack`, `index`, `index-styles`, `index-styles-pack`, `index-pack`, `pretty`, `slide`).
  - Cấu hình `builtin:swc-loader` với target `es2020`, loại bỏ `babel-polyfill` khỏi các entry point.
  - Kích hoạt `experiments: { css: true }` để sử dụng trực tiếp LightningCSS.
  - Cấu hình Asset Modules (`type: 'asset/resource'`, `type: 'asset/inline'`) cho fonts/images.
  - Cấu hình `rspack.ProvidePlugin` cho jQuery, moment, Visibility, Cookies, key, CodeMirror.
  - Cấu hình 8 instance `rspack.HtmlRspackPlugin` sinh các EJS partials vào `app/public/views/build/`:
    - `index-pack-header.ejs`, `index-pack-scripts.ejs`
    - `cover-pack-header.ejs`, `cover-pack-scripts.ejs`
    - `pretty-pack-header.ejs`, `pretty-pack-scripts.ejs`
    - `slide-pack-header.ejs`, `slide-pack-scripts.ejs`
  - Cấu hình `rspack.CopyRspackPlugin` sao chép MathJax, Reveal.js, và `constrain-object.min.js`.

### Bước 1.2: Tạo `app/rspack.dev.js` & `app/rspack.prod.js`
- **Mục tiêu:**
  - `rspack.dev.js`: Cấu hình `mode: 'development'`, source-map `cheap-module-source-map`, xuất filename dạng thường (không hash) cho dev workflow nhanh.
  - `rspack.prod.js`: Cấu hình `mode: 'production'`, `devtool: 'source-map'`, contenthash cho assets (`[name].[contenthash:10].js`, `[name].[contenthash:10].css`), tối ưu `splitChunks: { chunks: 'all' }`, kích hoạt `rspack.LightningCssMinimizerRspackPlugin` và `rspack.SwcJsMinimizerRspackPlugin`.

### Bước 1.3: Tạo `app/rspack.htmlexport.js`
- **Mục tiêu:**
  - Độc lập hóa cấu hình xuất HTML tĩnh cho tính năng Save-as-HTML (`htmlexport.html`, `htmlexport.css`, `htmlExport.js`).

### Bước 1.4: Cập nhật `app/package.json`
- **Mục tiêu:**
  - Bổ sung `@rspack/core` và `@rspack/cli` vào `devDependencies`.
  - Cập nhật scripts:
    - `"build": "rspack build --config rspack.prod.js --progress"`
    - `"dev": "rspack build --config rspack.dev.js --watch"`
    - `"build:legacy": "webpack --config webpack.prod.js --progress"` (giữ tạm làm đối chiếu)
  - Loại bỏ các gói Babel 6 và Webpack 4 đã lỗi thời.

---

## Giai đoạn 2: Tạo Script Standalone Container Build (Hỗ Trợ Không Cần Node Modules Trên Host)

### Bước 2.1: Tạo script `app/bin/build-assets.sh`
- **Mục tiêu:**
  - Cho phép chạy Rspack build trực tiếp trong container Podman/Docker tạm thời mà không cần cài đặt `node_modules` nặng nề trên máy host.
  - Kiểm tra nếu có sẵn Podman hoặc Docker để tự động thực thi.

---

## Giai đoạn 3: Kiểm Thử Tự Động & Đảm Bảo Chất Lượng (QA & Verification)

### Bước 3.1: Viết test suite `app/test/rspack-build.test.js`
- **Mục tiêu:**
  - Kiểm tra cấu hình `rspack.common.js`, `rspack.prod.js`, `rspack.htmlexport.js` có cú pháp hợp lệ.
  - Kiểm tra loại bỏ thành công `babel-polyfill` và monkeypatch `crypto.createHash`.
  - Kiểm tra toàn bộ 8 file EJS partials trong `app/public/views/build/` có cấu trúc thẻ hợp lệ.

### Bước 3.2: Chạy toàn bộ test suites
- **Lệnh thực thi:**
  `node --test app/test/widescreen-layout.test.js app/test/docusaurus-theme.test.js app/test/docusaurus-tokens.test.js app/test/inpage-search.test.js app/test/rspack-build.test.js`
- **Tiêu chí đạt:** 5/5 test suites PASS 100%.

### Bước 3.3: Smoke Test HTTP trên Container
- **Mục tiêu:**
  - Kiểm tra HTTP 200 OK trên các trang:
    - Dashboard: `http://localhost:3000/`
    - Editor: `http://localhost:3000/features`
    - Publish: `http://localhost:3000/s/features`
  - Đảm bảo các file static JS/CSS tải về không bị lỗi 404 và không có lỗi runtime trên client.
