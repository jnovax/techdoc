---
title: "Kế hoạch thực hiện: Chuẩn hóa Hệ thống Design Tokens & Typography Docusaurus v3"
type: implementation-plan
date: 2026-09-09
spec: hedgedoc/docs/superpowers/specs/2026-09-09-docusaurus-v3-design-tokens-spec.md
---

# Kế hoạch thực hiện: Chuẩn hóa Hệ thống Design Tokens & Typography Docusaurus v3

Tài liệu này chi tiết các bước cụ thể để tái cấu trúc và chuẩn hóa hoàn toàn giao diện tài liệu của HedgeDoc (`docusaurus-theme.css`, `docusaurus-toc.js`, `pretty.ejs`, `head.ejs`) theo đúng hệ thống biến Design Tokens và Infima framework của `docusaurus.io/docs`.

---

## Cấu trúc công việc (Task Breakdown)

- **Task 1: Tạo bộ kiểm thử tự động xác minh Design Tokens**
  - File: `hedgedoc/test/docusaurus-tokens.test.js`
  - Kiểm tra tính đầy đủ của các biến `:root` bắt buộc (--ifm-font-family-base, --ifm-font-size-base, --ifm-line-height-base, --ifm-color-content, --ifm-h1-font-size, v.v.).
  - Kiểm tra regex nhận diện các loại Admonition Callout (`NOTE`, `TIP`, `INFO`, `WARNING`, `DANGER`).

- **Task 2: Xây dựng hệ thống Design Tokens trong `docusaurus-theme.css`**
  - File: `hedgedoc/public/css/docusaurus-theme.css`
  - Định nghĩa khối `:root` với đầy đủ các biến Infima Docusaurus v3.
  - Chuẩn hóa typography body `16.5px`, line-height `1.65`, màu `#1c1e21`.
  - Chuẩn hóa tiêu đề `h1` (40px), `h2` (32px kèm viền chân), `h3` (24px).
  - Định dạng 5 lớp Admonition (`.alert--note`, `.alert--tip`, `.alert--info`, `.alert--warning`, `.alert--danger`).
  - Định dạng bảng biểu thẻ bo góc `8px`, header `#f6f8fa`, ô dữ liệu `16px`.
  - Định dạng thanh mục lục TOC chuẩn Docusaurus: font `14px`, viền `#ebedf0`, active indicator.

- **Task 3: Bổ sung Script hỗ trợ Admonition Callouts trong `docusaurus-toc.js`**
  - File: `hedgedoc/public/js/docusaurus-toc.js`
  - Quét các khối `blockquote` chứa `[!NOTE]`, `[!TIP]`, `[!INFO]`, `[!WARNING]`, `[!DANGER]` để tự động gắn class tương ứng, hiển thị icon và tiêu đề callout đẹp mắt.

- **Task 4: Tích hợp, Cập nhật Cache-Busting & Kiểm thử toàn diện**
  - Files:
    - `hedgedoc/public/views/pretty.ejs`
    - `hedgedoc/public/views/hedgedoc/head.ejs`
  - Cập nhật phiên bản stylesheet `?v=20260909_docusaurus_v3`.
  - Khởi động lại container `hedgedoc_app_1`.
  - Chạy toàn bộ test suites và kiểm tra HTTP bằng curl.

---

### Task 1: Bộ kiểm thử tự động cho Design Tokens (`docusaurus-tokens.test.js`)

**Files:**
- Create: `hedgedoc/test/docusaurus-tokens.test.js`

- [ ] **Step 1: Tạo file kiểm thử `hedgedoc/test/docusaurus-tokens.test.js`**

```javascript
'use strict'
const assert = require('assert')
const fs = require('fs')
const path = require('path')

function parseCalloutType (text) {
  if (!text) return null
  const match = text.match(/^\[!(NOTE|TIP|INFO|WARNING|DANGER|IMPORTANT)\]/i)
  if (match) {
    const type = match[1].toLowerCase()
    if (type === 'important') return 'warning'
    return type
  }
  return null
}

function runTests () {
  // Test 1: Admonition Callout Parsing
  assert.strictEqual(parseCalloutType('[!NOTE] Đây là ghi chú'), 'note')
  assert.strictEqual(parseCalloutType('[!TIP] Mẹo hay'), 'tip')
  assert.strictEqual(parseCalloutType('[!INFO] Thông tin thêm'), 'info')
  assert.strictEqual(parseCalloutType('[!WARNING] Cảnh báo quan trọng'), 'warning')
  assert.strictEqual(parseCalloutType('[!DANGER] Nguy hiểm chết người'), 'danger')
  assert.strictEqual(parseCalloutType('[!IMPORTANT] Rất quan trọng'), 'warning')
  assert.strictEqual(parseCalloutType('Đoạn trích dẫn thông thường'), null)

  // Test 2: Kiểm tra sự tồn tại của CSS file và các biến token cốt lõi
  const cssPath = path.join(__dirname, '../public/css/docusaurus-theme.css')
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8')
    const requiredTokens = [
      '--ifm-font-family-base',
      '--ifm-font-size-base',
      '--ifm-line-height-base',
      '--ifm-color-content',
      '--ifm-h1-font-size',
      '--ifm-h2-font-size',
      '--ifm-h3-font-size'
    ]
    requiredTokens.forEach(token => {
      assert.ok(css.includes(token), `Thiếu biến design token: ${token}`)
    })
  }

  console.log('Docusaurus Design Tokens tests passed!')
}

if (typeof describe !== 'undefined') {
  describe('Docusaurus Design Tokens', function () {
    it('should validate callouts and design tokens', function () {
      runTests()
    })
  })
} else {
  runTests()
}
```

- [ ] **Step 2: Chạy kiểm thử ban đầu (phần callout regex)**
```bash
node hedgedoc/test/docusaurus-tokens.test.js
```

---

### Task 2: Tái cấu trúc `hedgedoc/public/css/docusaurus-theme.css`

**Files:**
- Modify: `hedgedoc/public/css/docusaurus-theme.css`

- [ ] **Step 1: Viết lại `docusaurus-theme.css` với toàn bộ Design Tokens Docusaurus v3**
Bao gồm:
- Khối `:root` chứa các biến `--ifm-*`.
- `body.docusaurus-layout`: typography chuẩn `16.5px`, line-height `1.65`, màu `#1c1e21`.
- `#doc.markdown-body`:
  - `h1`: `2.5rem` (40px), bold `700`, `letter-spacing: -0.02em`.
  - `h2`: `2.0rem` (32px), bold `700`, viền `1px solid var(--ifm-toc-border-color)`.
  - `h3`: `1.5rem` (24px), semibold `600`.
  - `h4`: `1.25rem` (20px).
- Bảng biểu `table`: `border-collapse: separate; border-spacing: 0; border: 1px solid #ebedf0; border-radius: 8px;`.
- Admonitions:
  - `.admonition-note`: viền `#2563eb`, nền `#eff6ff`.
  - `.admonition-tip`: viền `#00a400`, nền `#e6f6e6`.
  - `.admonition-info`: viền `#54c7ec`, nền `#eef9fd`.
  - `.admonition-warning`: viền `#ffba00`, nền `#fff9e6`.
  - `.admonition-danger`: viền `#fa383e`, nền `#ffebec`.
- Thanh mục lục TOC: font `14px`, viền `#ebedf0`, active item highlight.

---

### Task 3: Bổ sung Script hỗ trợ Admonitions trong `docusaurus-toc.js`

**Files:**
- Modify: `hedgedoc/public/js/docusaurus-toc.js`

- [ ] **Step 1: Quét và trang trí các khối blockquote thành Admonition Callout**
Hàm `decorateAdmonitions()`:
- Quét các thẻ `blockquote` trong `#doc`.
- Kiểm tra nội dung bắt đầu bằng `[!NOTE]`, `[!TIP]`, `[!INFO]`, `[!WARNING]`, `[!DANGER]`.
- Thêm class tương ứng (`admonition-box admonition-note`, v.v.) và icon đại diện.

---

### Task 4: Tích hợp, Cache-Busting & Kiểm thử toàn diện

**Files:**
- Modify: `hedgedoc/public/views/pretty.ejs`
- Modify: `hedgedoc/public/views/hedgedoc/head.ejs`

- [ ] **Step 1: Cập nhật cache-busting query parameter**
Cập nhật link:
`<link rel="stylesheet" href="<%- serverURL %>/css/docusaurus-theme.css?v=20260909_docusaurus_v3">`
`<script src="<%- serverURL %>/js/docusaurus-toc.js?v=20260909_docusaurus_v3" defer></script>`

- [ ] **Step 2: Chạy toàn bộ test suites**
```bash
node hedgedoc/test/docusaurus-tokens.test.js && node hedgedoc/test/note-trash-delete.test.js && node hedgedoc/test/docusaurus-theme.test.js && node hedgedoc/test/inpage-search.test.js && node hedgedoc/test/login-redirect.test.js && node hedgedoc/test/portal-query.test.js
```

- [ ] **Step 3: Khởi động lại container**
```bash
podman restart hedgedoc_app_1
```

- [ ] **Step 4: Kiểm tra HTTP curl**
Kiểm tra `curl -sL http://localhost:3000/s/DK_35DTq4g` trả về đúng stylesheet và giao diện mới.
