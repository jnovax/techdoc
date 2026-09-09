# Design Specification: Docusaurus-Style Modern Reader & Preview Interface

- **Date:** 2026-09-09
- **Status:** Approved
- **Target Version:** HedgeDoc 1.12.0
- **Authors:** Antigravity & User

---

## 1. Overview & Objectives

The goal of this design is to upgrade HedgeDoc's reading and viewing experience (`pretty.ejs` published notes and `hedgedoc.ejs` editor preview pane) to match the clean, readable, and modern aesthetics of **Docusaurus.io**:

1. **Modern Documentation Layout**:
   - Sticky Top Navbar featuring HedgeDoc brand, note title breadcrumb, "← Trang chủ" button, and "Chỉnh sửa" (Edit) button.
   - Golden-ratio centered content column (`max-width: 860px`) preventing eye fatigue on widescreen monitors.
2. **Sticky Table of Contents ("On this page")**:
   - A dedicated right sidebar (`width: 240px`) fixed at `top: 80px`.
   - Real-time Scrollspy using `IntersectionObserver` that highlights the currently read heading with an active blue bar.
   - Mobile-responsive collapse for tablet and smartphone viewports (< 1024px).
3. **Docusaurus Typography & Component Styling**:
   - High-readability font system (`Inter` / System UI stack, `16.5px`, `1.75` line height, `#1e293b` text).
   - Premium dark code blocks (`#1e1e2e` background, `10px` border-radius, monospace typography).
   - Docusaurus-style Admonitions / Callout banners (`Note`, `Tip`, `Warning`, `Danger`).
   - Clean bordered tables with subtle row hover effects.
4. **WYSIWYG Preview Synchronization**:
   - Both the read-only view (`pretty.ejs`) and the editor preview pane (`hedgedoc.ejs`) share the same typography and component styles so writers see the exact published appearance while typing.

---

## 2. Layout & Page Structure

```
+------------------------------------------------------------------------------------+
| STICKY NAVBAR: [Logo] HedgeDoc / [Doc Title]     [← Trang chủ] [✎ Chỉnh sửa]       |
+------------------------------------------------------------------------------------+
|                                                                                    |
|      MAIN READING COLUMN (Max-width: 860px)       |   STICKY TOC (240px)           |
|                                                   |                                |
|   # Main Heading 1                                |   MỤC LỤC NỘI DUNG             |
|   Paragraph text with optimal line-height...      |   - Giới thiệu                 |
|                                                   |   - Cài đặt hệ thống           |
|   ## Section Heading 2                            |     * Cấu hình môi trường (act)|
|   > [!NOTE] Docusaurus Callout Box                |     * Chạy lệnh                |
|                                                   |   - Kiểm thử                   |
|   ```javascript                                   |                                |
|   const code = "Dark modern styling";             |                                |
|   ```                                             |                                |
|                                                   |                                |
+------------------------------------------------------------------------------------+
```

### 2.1 Viewport Breakpoints
- **Desktop (>= 1024px)**: 2-column view with centered content and sticky right TOC.
- **Tablet & Mobile (< 1024px)**: 1-column view with 100% width content; right TOC sidebar is hidden from desktop flow and accessible via a floating/drawer toggle button.

---

## 3. Detailed Component Specifications

### 3.1 Sticky Navbar Header (`pretty.ejs`)
- Fixed at top: `position: sticky; top: 0; z-index: 1000; height: 60px; background: #ffffff; border-bottom: 1px solid #e2e8f0;`.
- **Left Group**:
  - Logo link to `/`.
  - Slash separator (`/`).
  - Truncated note title (font-weight 600, color `#0f172a`).
- **Right Group**:
  - Button "← Trang chủ" (links to `/`).
  - Button "Chỉnh sửa" (links to note edit URL).
  - Subtle metadata: Last updated date and view count.

### 3.2 Docusaurus Typography & Component Styling (`docusaurus-theme.css`)

#### 1. General Typography
```css
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  font-size: 16.5px !important;
  line-height: 1.75 !important;
  color: #1e293b !important;
}

.markdown-body h1 {
  font-size: 2.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-top: 0;
  margin-bottom: 1.5rem;
  letter-spacing: -0.025em;
}

.markdown-body h2 {
  font-size: 1.65rem;
  font-weight: 700;
  color: #0f172a;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
  margin-top: 2.25rem;
  margin-bottom: 1rem;
}

.markdown-body h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
}
```

#### 2. Code Blocks & Inline Code
```css
.markdown-body pre {
  background-color: #1e1e2e !important;
  border-radius: 10px !important;
  border: 1px solid #313244 !important;
  padding: 16px 20px !important;
  color: #cdd6f4 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.markdown-body code {
  font-family: "Fira Code", SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
}

.markdown-body :not(pre) > code {
  background-color: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  color: #e11d48 !important;
  font-size: 85% !important;
  border-radius: 5px !important;
  padding: 2px 6px !important;
}
```

#### 3. Callout / Admonition Blocks
Support classic markdown quote blocks formatted with callout headers (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!CAUTION]`):
- Left border: `4px solid <accent_color>`.
- Background: Soft pastel tint.
- Border radius: `0 8px 8px 0`.
- Padding: `14px 18px`.

#### 4. Tables
- Border: `1px solid #e2e8f0` with rounded corners.
- Header row: `#f8fafc` background, font-weight 700.
- Alternating row / hover highlight: `#f1f5f9`.

### 3.3 Dynamic Sticky Table of Contents (`docusaurus-toc.js`)

- **Scanner**: Reads headings (`h1`, `h2`, `h3`) inside `#doc.markdown-body`.
- **ID Assignment**: Assigns URL-safe slug IDs to headings if not already present.
- **TOC Tree Generator**:
  - Builds `<ul class="docusaurus-toc-list">` with nested indentation for `h3`.
  - Appends to `<aside class="docusaurus-toc-sidebar">`.
- **Scrollspy via `IntersectionObserver`**:
  - Observes all heading elements with `rootMargin: '0px 0px -70% 0px'`.
  - Toggles `.active` class on the matching TOC link.
  - Active TOC link displays: `color: #2563eb; font-weight: 600; border-left: 2px solid #2563eb;`.

### 3.4 Integration Matrix

| View File | Component / Asset | Purpose |
| :--- | :--- | :--- |
| `hedgedoc/public/views/pretty.ejs` | `docusaurus-theme.css`, `docusaurus-toc.js` | Full 2-column layout, sticky navbar, and TOC scrollspy |
| `hedgedoc/public/views/hedgedoc/head.ejs` | `docusaurus-theme.css` | Typography and code block styling in editor preview pane |

---

## 4. Testing & Verification Plan

1. **Visual Typography Verification**:
   - Inspect body text font size, line-height, and headings hierarchy.
   - Verify code blocks have dark background, rounded corners, and proper syntax colors.
   - Verify inline code has pink/red tint with rounded borders.
   - Verify callout/admonition boxes render with left colored border.
2. **Sticky TOC & Scrollspy Verification**:
   - Verify the "MỤC LỤC NỘI DUNG" sidebar appears on desktop (>= 1024px).
   - Scroll through document sections: verify the active TOC item smoothly changes highlight in real-time.
   - Click a TOC item: verify smooth scrolling lands accurately at the heading.
   - Resize window to mobile width (< 1024px): verify layout gracefully collapses to 1 column without horizontal scrollbars.
3. **Editor Preview Verification**:
   - Open editor (`/:noteId`): verify preview pane inherits identical typography, headings, tables, and code block styling.
