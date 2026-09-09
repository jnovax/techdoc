# Docusaurus-Style Modern Reader & Preview Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform HedgeDoc's read/publish mode (`pretty.ejs`) and editor preview pane (`hedgedoc.ejs`) into a modern, highly readable documentation interface matching Docusaurus.io, featuring a sticky top navigation bar, 2-column layout with a sticky right Table of Contents and real-time scrollspy, refined typography, dark code blocks, and callout admonitions.

**Architecture:**
- `docusaurus-theme.css`: Core theme layer defining Docusaurus typography, dark code blocks, inline code, callout alerts, table styling, and responsive 2-column grid layout.
- `docusaurus-toc.js`: Client-side TOC parser generating a hierarchical list of document headings (`h1`, `h2`, `h3`), handling smooth click scrolling, and tracking current reading position with `IntersectionObserver` scrollspy.
- Template integration in `hedgedoc/public/views/pretty.ejs` and `hedgedoc/public/views/hedgedoc/head.ejs`.

**Tech Stack:** JavaScript (ES6 Vanilla), CSS3, EJS templates.

---

### Task 1: TOC Slugification & Parser Test Suite

**Files:**
- Create: `hedgedoc/test/docusaurus-theme.test.js`

- [ ] **Step 1: Write unit tests for heading slugification and TOC hierarchy extraction**

Create `hedgedoc/test/docusaurus-theme.test.js`:
```javascript
'use strict'
const assert = require('assert')

function slugify (text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u00C0-\u024F\u1EA0-\u1EF9\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

function parseHeadings (headings) {
  return headings.map((h, idx) => ({
    level: parseInt(h.tagName.replace('H', ''), 10),
    text: h.textContent.trim(),
    id: h.id || slugify(h.textContent) || 'heading-' + idx
  }))
}

function runTests () {
  // Test 1: Slugification (Unicode & Vietnamese support)
  assert.strictEqual(slugify('HedgeDoc Installation & Setup'), 'hedgedoc-installation--setup'.replace(/--+/g, '-'))
  assert.strictEqual(slugify('Hướng dẫn sử dụng hệ thống!'), 'hướng-dẫn-sử-dụng-hệ-thống')
  assert.strictEqual(slugify(''), '')

  // Test 2: Headings hierarchy extraction
  const mockHeadings = [
    { tagName: 'H1', textContent: 'Giới thiệu', id: '' },
    { tagName: 'H2', textContent: 'Cài đặt', id: 'cai-dat' },
    { tagName: 'H3', textContent: 'Cấu hình Docker', id: '' }
  ]

  const parsed = parseHeadings(mockHeadings)
  assert.strictEqual(parsed.length, 3)
  assert.strictEqual(parsed[0].level, 1)
  assert.strictEqual(parsed[0].id, 'giới-thiệu')
  assert.strictEqual(parsed[1].id, 'cai-dat')
  assert.strictEqual(parsed[2].level, 3)
  assert.strictEqual(parsed[2].id, 'cấu-hình-docker')

  console.log('Docusaurus theme & TOC logic tests passed!')
}

if (typeof describe !== 'undefined') {
  describe('Docusaurus TOC Logic', function () {
    it('should correctly slugify headings and parse hierarchy', function () {
      runTests()
    })
  })
} else {
  runTests()
}
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node hedgedoc/test/docusaurus-theme.test.js`
Expected: `Docusaurus theme & TOC logic tests passed!`

- [ ] **Step 3: Commit Task 1 changes**

```bash
git add hedgedoc/test/docusaurus-theme.test.js
git commit -m "test(toc): add unit tests for heading slugification and TOC hierarchy extraction"
```

---

### Task 2: Docusaurus Theme Stylesheet (`docusaurus-theme.css`)

**Files:**
- Create: `hedgedoc/public/css/docusaurus-theme.css`

- [ ] **Step 1: Create `hedgedoc/public/css/docusaurus-theme.css`**

Define Docusaurus layout, typography, headings, dark code blocks, inline code, admonitions, and sticky right TOC styling:
```css
/* ==========================================================================
   Docusaurus Modern Documentation Theme for HedgeDoc
   ========================================================================== */

/* Overall Page Layout */
body.docusaurus-layout {
  background-color: #ffffff !important;
  color: #1e293b !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  margin: 0;
  padding: 0;
}

/* Sticky Top Navigation Bar */
.docusaurus-navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.docusaurus-navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.docusaurus-navbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none !important;
  font-weight: 700;
  color: #0f172a !important;
}

.docusaurus-navbar-brand img {
  height: 28px;
}

.docusaurus-navbar-separator {
  color: #cbd5e1;
  font-weight: 300;
}

.docusaurus-navbar-title {
  color: #475569;
  font-weight: 600;
  max-width: 380px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.docusaurus-navbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.docusaurus-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none !important;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.docusaurus-nav-btn-outline {
  color: #475569 !important;
  border-color: #cbd5e1;
  background: #ffffff;
}

.docusaurus-nav-btn-outline:hover {
  background: #f8fafc;
  color: #0f172a !important;
  border-color: #94a3b8;
}

.docusaurus-nav-btn-primary {
  color: #ffffff !important;
  background-color: #2563eb;
}

.docusaurus-nav-btn-primary:hover {
  background-color: #1d4ed8;
}

/* 2-Column Documentation Wrapper */
.docusaurus-container {
  display: flex;
  justify-content: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 24px 80px;
  gap: 48px;
}

.docusaurus-main-content {
  flex: 1;
  max-width: 860px;
  min-width: 0;
}

/* Right Sidebar (Sticky TOC) */
.docusaurus-toc-sidebar {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 84px;
  height: fit-content;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  padding-left: 16px;
  border-left: 1px solid #f1f5f9;
}

.docusaurus-toc-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #64748b;
  margin-bottom: 12px;
}

.docusaurus-toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.docusaurus-toc-item {
  margin-bottom: 6px;
}

.docusaurus-toc-item.level-3 {
  padding-left: 14px;
}

.docusaurus-toc-link {
  display: block;
  font-size: 13.5px;
  color: #64748b;
  text-decoration: none !important;
  line-height: 1.4;
  padding: 3px 0 3px 8px;
  border-left: 2px solid transparent;
  transition: all 0.15s ease;
}

.docusaurus-toc-link:hover {
  color: #2563eb;
}

.docusaurus-toc-link.active {
  color: #2563eb;
  font-weight: 600;
  border-left-color: #2563eb;
  background-color: rgba(37, 99, 235, 0.04);
  border-radius: 0 4px 4px 0;
}

/* Typography Enhancements for #doc.markdown-body */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  font-size: 16.5px !important;
  line-height: 1.75 !important;
  color: #1e293b !important;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  font-family: inherit !important;
  position: relative;
}

.markdown-body h1 {
  font-size: 2.25rem !important;
  font-weight: 800 !important;
  color: #0f172a !important;
  margin-top: 0 !important;
  margin-bottom: 1.5rem !important;
  letter-spacing: -0.025em !important;
  line-height: 1.25 !important;
}

.markdown-body h2 {
  font-size: 1.65rem !important;
  font-weight: 700 !important;
  color: #0f172a !important;
  border-bottom: 1px solid #e2e8f0 !important;
  padding-bottom: 0.5rem !important;
  margin-top: 2.5rem !important;
  margin-bottom: 1rem !important;
  letter-spacing: -0.02em !important;
}

.markdown-body h3 {
  font-size: 1.3rem !important;
  font-weight: 600 !important;
  color: #1e293b !important;
  margin-top: 2rem !important;
  margin-bottom: 0.75rem !important;
}

.markdown-body p {
  margin-bottom: 1.25rem !important;
}

/* Dark Code Blocks */
.markdown-body pre {
  background-color: #1e1e2e !important;
  border-radius: 10px !important;
  border: 1px solid #313244 !important;
  padding: 18px 22px !important;
  color: #cdd6f4 !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08) !important;
  margin: 1.5rem 0 !important;
  overflow-x: auto !important;
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
  font-weight: 500 !important;
}

/* Callouts & Admonitions */
.markdown-body blockquote {
  border-left: 4px solid #cbd5e1 !important;
  background: #f8fafc !important;
  padding: 14px 20px !important;
  border-radius: 0 8px 8px 0 !important;
  color: #475569 !important;
  margin: 1.5rem 0 !important;
}

.markdown-body blockquote p:last-child {
  margin-bottom: 0 !important;
}

/* Tables */
.markdown-body table {
  width: 100% !important;
  border-collapse: collapse !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  margin: 1.5rem 0 !important;
}

.markdown-body table th {
  background-color: #f8fafc !important;
  color: #0f172a !important;
  font-weight: 700 !important;
  border: 1px solid #e2e8f0 !important;
  padding: 12px 16px !important;
  text-align: left !important;
}

.markdown-body table td {
  border: 1px solid #e2e8f0 !important;
  padding: 12px 16px !important;
  color: #334155 !important;
}

.markdown-body table tr:hover td {
  background-color: #f8fafc !important;
}

/* Responsive Handling */
@media (max-width: 1024px) {
  .docusaurus-toc-sidebar {
    display: none !important;
  }
  .docusaurus-container {
    padding: 24px 16px 60px;
    gap: 0;
  }
  .docusaurus-main-content {
    max-width: 100%;
  }
}
```

- [ ] **Step 2: Commit Task 2 changes**

```bash
git add hedgedoc/public/css/docusaurus-theme.css
git commit -m "feat(ui): create docusaurus-theme.css for modern documentation typography and layout"
```

---

### Task 3: Sticky Table of Contents & Scrollspy Script (`docusaurus-toc.js`)

**Files:**
- Create: `hedgedoc/public/js/docusaurus-toc.js`

- [ ] **Step 1: Create `hedgedoc/public/js/docusaurus-toc.js`**

Implement dynamic heading slugification, TOC DOM generation, click-to-scroll, and IntersectionObserver scrollspy:
```javascript
(function () {
  'use strict';

  function slugify(text) {
    return (text || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u00C0-\u024F\u1EA0-\u1EF9\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  function initDocusaurusTOC() {
    var doc = document.getElementById('doc') || document.querySelector('.markdown-body');
    var tocContainer = document.getElementById('docusaurusToc');
    if (!doc || !tocContainer) return;

    var headings = doc.querySelectorAll('h1, h2, h3');
    if (headings.length === 0) {
      tocContainer.style.display = 'none';
      return;
    }

    var list = document.createElement('ul');
    list.className = 'docusaurus-toc-list';

    var links = [];
    var headingElements = [];

    headings.forEach(function (heading, idx) {
      if (!heading.textContent || !heading.textContent.trim()) return;

      var tagLevel = parseInt(heading.tagName.replace('H', ''), 10);
      if (tagLevel > 3) return;

      if (!heading.id) {
        var slug = slugify(heading.textContent);
        heading.id = slug || ('heading-' + idx);
      }

      var item = document.createElement('li');
      item.className = 'docusaurus-toc-item level-' + tagLevel;

      var link = document.createElement('a');
      link.className = 'docusaurus-toc-link';
      link.href = '#' + heading.id;
      link.textContent = heading.textContent.trim();

      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(heading.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState(null, null, '#' + heading.id);
        }
      });

      item.appendChild(link);
      list.appendChild(item);

      links.push(link);
      headingElements.push(heading);
    });

    tocContainer.innerHTML = '<div class="docusaurus-toc-title">MỤC LỤC NỘI DUNG</div>';
    tocContainer.appendChild(list);

    // Scrollspy with IntersectionObserver
    if ('IntersectionObserver' in window && headingElements.length > 0) {
      var currentActiveLink = null;

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var id = entry.target.id;
              var matchingLink = links.find(function (l) {
                return l.getAttribute('href') === '#' + id;
              });

              if (matchingLink && matchingLink !== currentActiveLink) {
                if (currentActiveLink) currentActiveLink.classList.remove('active');
                matchingLink.classList.add('active');
                currentActiveLink = matchingLink;
              }
            }
          });
        },
        {
          rootMargin: '0px 0px -65% 0px',
          threshold: 0.1
        }
      );

      headingElements.forEach(function (h) {
        observer.observe(h);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDocusaurusTOC);
  } else {
    initDocusaurusTOC();
  }
})();
```

- [ ] **Step 2: Commit Task 3 changes**

```bash
git add hedgedoc/public/js/docusaurus-toc.js
git commit -m "feat(toc): implement dynamic TOC builder with smooth scrolling and scrollspy"
```

---

### Task 4: Template Integration in `pretty.ejs` and `hedgedoc/head.ejs`

**Files:**
- Modify: `hedgedoc/public/views/pretty.ejs`
- Modify: `hedgedoc/public/views/hedgedoc/head.ejs`

- [ ] **Step 1: Update `hedgedoc/public/views/pretty.ejs`**

Transform `pretty.ejs` to use the Docusaurus sticky navbar, 2-column layout with `#doc` inside `.docusaurus-main-content` and `<aside id="docusaurusToc" class="docusaurus-toc-sidebar"></aside>`, and include `docusaurus-theme.css` and `docusaurus-toc.js`:
```html
<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <base href="<%- serverURL %>/">
    <title><%= title %></title>
    <%- include('includes/favicon.ejs') %>
    <link rel="stylesheet" href="<%- serverURL %>/build/emojify.js/dist/css/basic/emojify.min.css">
    <%- include('build/pretty-pack-header') %>
    <link rel="stylesheet" href="<%- serverURL %>/css/inpage-search.css">
    <link rel="stylesheet" href="<%- serverURL %>/css/docusaurus-theme.css">
</head>

<body class="docusaurus-layout">
    <!-- Docusaurus Sticky Header -->
    <header class="docusaurus-navbar">
        <div class="docusaurus-navbar-left">
            <a href="<%- serverURL %>/" class="docusaurus-navbar-brand">
                <img src="<%- serverURL %>/banner/banner_vertical_color.svg" alt="HedgeDoc">
                <span>HedgeDoc</span>
            </a>
            <span class="docusaurus-navbar-separator">/</span>
            <span class="docusaurus-navbar-title"><%= title %></span>
        </div>

        <div class="docusaurus-navbar-right">
            <span class="hidden-xs" style="font-size: 12px; color: #64748b; margin-right: 8px;">
                <i class="fa fa-eye"></i> <%- viewcount %> lượt xem
            </span>
            <a href="<%- serverURL %>/" class="docusaurus-nav-btn docusaurus-nav-btn-outline">
                <i class="fa fa-arrow-left"></i> <span class="hidden-xs">Trang chủ</span>
            </a>
            <a href="#" class="docusaurus-nav-btn docusaurus-nav-btn-primary ui-edit" title="Chỉnh sửa tài liệu">
                <i class="fa fa-pencil"></i> <span class="hidden-xs">Chỉnh sửa</span>
            </a>
        </div>
    </header>

    <!-- 2-Column Documentation Container -->
    <div class="docusaurus-container">
        <main class="docusaurus-main-content">
            <div id="doc" class="markdown-body" <% if (lang) { %> lang="<%= lang %>"<% } %>><%= body %></div>
            <% if(typeof disqus !== 'undefined' && disqus && !dnt) { %>
            <div style="margin-top: 50px;">
                <%- include('shared/disqus') %>
            </div>
            <% } %>
        </main>

        <aside id="docusaurusToc" class="docusaurus-toc-sidebar"></aside>
    </div>
</body>

</html>
<script src="<%= serverURL %>/js/mathjax-config-extra.js"></script>
<script src="<%- serverURL %>/build/MathJax/MathJax.js" defer></script>
<script src="<%- serverURL %>/build/MathJax/config/TeX-AMS-MML_HTMLorMML.js" defer></script>
<script src="<%- serverURL %>/build/MathJax/config/Safe.js" defer></script>
<%- include('build/pretty-pack-scripts') %>
<script src="<%- serverURL %>/js/inpage-search.js" defer></script>
<script src="<%- serverURL %>/js/docusaurus-toc.js" defer></script>
<%- include('shared/ga') %>
```

- [ ] **Step 2: Update `hedgedoc/public/views/hedgedoc/head.ejs`**

Include `docusaurus-theme.css` in `hedgedoc/public/views/hedgedoc/head.ejs` so the editor preview pane renders with the same Docusaurus typography:
```html
<link rel="stylesheet" href="<%- serverURL %>/css/docusaurus-theme.css">
```

- [ ] **Step 3: Commit Task 4 changes**

```bash
git add hedgedoc/public/views/pretty.ejs hedgedoc/public/views/hedgedoc/head.ejs
git commit -m "feat(views): integrate Docusaurus layout, navbar, and preview styles"
```

---

### Task 5: Integration Verification & Container Testing

**Files:**
- Test: Manual browser/curl verification with the running podman container.

- [ ] **Step 1: Run unit tests**

Run: `node hedgedoc/test/docusaurus-theme.test.js && node hedgedoc/test/inpage-search.test.js && node hedgedoc/test/login-redirect.test.js && node hedgedoc/test/portal-query.test.js`
Expected: All 4 test suites pass.

- [ ] **Step 2: Verify assets are served via HTTP**

Run: `curl -s -I http://localhost:3000/css/docusaurus-theme.css`
Expected: HTTP 200 OK
Run: `curl -s -I http://localhost:3000/js/docusaurus-toc.js`
Expected: HTTP 200 OK

- [ ] **Step 3: Verify pretty note view HTML structure**

Run: `curl -sL http://localhost:3000/s/DK_35DTq4g | grep -C 3 "docusaurus-navbar"`
Expected: Sticky navbar and Docusaurus layout classes are present in output.
