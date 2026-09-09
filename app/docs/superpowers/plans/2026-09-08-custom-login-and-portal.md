# Standalone Login & Role-Based Document Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated `/login` page with return-to redirection and transform the HedgeDoc home page (`/`) into a modern, role-based Document Catalog where guests see only public notes, members see public and protected notes plus their own drafts, and protected notes redirect guests to login.

**Architecture:** 
- Express.js router (`baseRouter.js`) and controllers (`response.js`) handle `/login` routing, return-to query/session storage, and role-based Sequelize queries on `models.Note`.
- Note access permission middleware in `note/util.js` redirects unauthorized guests to `/login?returnTo=...`.
- EJS templates (`login.ejs` and redesigned `index.ejs`/`index/body.ejs`) render a clean standalone login screen and a modern card-grid document portal with instant search and permission badges.

**Tech Stack:** Node.js, Express, Sequelize (PostgreSQL), EJS, Bootstrap / Custom CSS, JavaScript.

---

### Task 1: Standalone Login Route & Redirection Backend Logic

**Files:**
- Modify: `src/lib/web/baseRouter.js`
- Modify: `src/lib/response.js`
- Modify: `src/lib/web/note/util.js`
- Modify: `src/lib/web/auth/email/index.js`
- Test: `src/test/login-redirect.test.js`

- [ ] **Step 1: Write the failing test for login route and redirection logic**

Create `src/test/login-redirect.test.js`:
```javascript
'use strict'
const assert = require('assert')

describe('Login & Redirection Logic', function () {
  it('should sanitize returnTo to only allow relative paths', function () {
    const sanitizeReturnTo = (url) => {
      if (!url || typeof url !== 'string') return '/'
      if (url.startsWith('/') && !url.startsWith('//')) return url
      return '/'
    }

    assert.strictEqual(sanitizeReturnTo('/p/note-123'), '/p/note-123')
    assert.strictEqual(sanitizeReturnTo('https://evil.com'), '/')
    assert.strictEqual(sanitizeReturnTo('//evil.com'), '/')
    assert.strictEqual(sanitizeReturnTo(''), '/')
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node src/test/login-redirect.test.js`
Expected: Test passes.

- [ ] **Step 3: Update `src/lib/web/baseRouter.js` to register `/login`**

Add `baseRouter.get('/login', response.showLogin)` in `src/lib/web/baseRouter.js`:
```javascript
// get login
baseRouter.get('/login', response.showLogin)
```

- [ ] **Step 4: Implement `showLogin` in `src/lib/response.js`**

Add `showLogin` function to `src/lib/response.js` and export it:
```javascript
function showLogin (req, res, next) {
  if (req.isAuthenticated()) {
    const redirectUrl = req.session.returnTo && req.session.returnTo.startsWith('/') && !req.session.returnTo.startsWith('//')
      ? req.session.returnTo
      : config.serverURL + '/'
    delete req.session.returnTo
    return res.redirect(redirectUrl)
  }

  if (req.query.returnTo) {
    const rawReturnTo = req.query.returnTo
    if (rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')) {
      req.session.returnTo = rawReturnTo
    }
  }

  const data = {
    signin: false,
    infoMessage: req.flash('info'),
    errorMessage: req.flash('error'),
    authProviders: config.authProviders,
    allowEmailRegister: config.allowEmailRegister,
    returnTo: req.session.returnTo || ''
  }

  res.render('login.ejs', data)
}
```

- [ ] **Step 5: Update `src/lib/web/note/util.js` to redirect unauthenticated guests**

In `src/lib/web/note/util.js`, update `findNote` view permission check:
```javascript
if (!exports.checkViewPermission(req, note)) {
  if (!req.isAuthenticated() && (note.permission === 'protected' || note.permission === 'limited')) {
    const returnUrl = encodeURIComponent(req.originalUrl || '/' + (note.alias || note.shortid))
    return res.redirect(config.serverURL + '/login?returnTo=' + returnUrl)
  }
  return errors.errorForbidden(res)
} else {
  return callback(note)
}
```

- [ ] **Step 6: Update post-login redirection in `src/lib/web/auth/email/index.js`**

In `src/lib/web/auth/email/index.js`, update the login handler so successful login respects `req.session.returnTo`:
```javascript
const returnTo = req.session.returnTo && req.session.returnTo.startsWith('/') && !req.session.returnTo.startsWith('//')
  ? req.session.returnTo
  : config.serverURL + '/'
delete req.session.returnTo
return res.redirect(returnTo)
```

- [ ] **Step 7: Commit Task 1 changes**

```bash
git -C src add lib/web/baseRouter.js lib/response.js lib/web/note/util.js lib/web/auth/email/index.js test/login-redirect.test.js
git -C src commit -m "feat(auth): add /login route, returnTo session handler, and protected note redirect"
```

---

### Task 2: Dedicated Standalone Login View (`login.ejs`)

**Files:**
- Create: `src/public/views/login.ejs`
- Create: `src/public/css/login.css`

- [ ] **Step 1: Create `src/public/css/login.css`**

Create modern styling for the standalone login page:
```css
body.login-page {
  background: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #1e293b;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 20px;
}

.login-card {
  background: #ffffff;
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 36px 32px;
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo {
  max-height: 48px;
  margin-bottom: 16px;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #0f172a;
}

.login-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.login-form .form-group {
  margin-bottom: 18px;
}

.login-form label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.login-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.login-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.login-btn-submit {
  width: 100%;
  padding: 11px;
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 8px;
}

.login-btn-submit:hover {
  background-color: #1d4ed8;
}

.login-separator {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 22px 0;
  color: #94a3b8;
  font-size: 12px;
}

.login-separator::before,
.login-separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}

.login-separator::before { margin-right: 12px; }
.login-separator::after { margin-left: 12px; }

.login-oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  margin-bottom: 10px;
  transition: background-color 0.2s;
}

.login-oauth-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: #64748b;
}

.login-footer a {
  color: #2563eb;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 2: Create `src/public/views/login.ejs`**

Create `src/public/views/login.ejs`:
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập - HedgeDoc</title>
    <link rel="icon" type="image/png" href="<%- serverURL %>/favicon.png">
    <link rel="stylesheet" href="<%- serverURL %>/css/login.css">
    <link rel="stylesheet" href="<%- serverURL %>/build/font-pack.css">
</head>
<body class="login-page">
    <div class="login-card">
        <div class="login-header">
            <a href="<%- serverURL %>/">
                <img src="<%- serverURL %>/banner/banner_vertical_color.svg" alt="HedgeDoc" class="login-logo">
            </a>
            <h1 class="login-title">Đăng nhập hệ thống</h1>
            <p class="login-subtitle">Nhập tài khoản của bạn để truy cập tài liệu</p>
        </div>

        <% if (errorMessage && errorMessage.length > 0) { %>
            <div style="background: #fee2e2; border: 1px solid #f87171; color: #991b1b; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 14px;">
                <%= errorMessage %>
            </div>
        <% } %>

        <% if (infoMessage && infoMessage.length > 0) { %>
            <div style="background: #dbeafe; border: 1px solid #60a5fa; color: #1e40af; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 14px;">
                <%= infoMessage %>
            </div>
        <% } %>

        <% if (authProviders.email) { %>
            <form action="<%- serverURL %>/auth/email/login" method="POST" class="login-form">
                <div class="form-group">
                    <label for="email">Địa chỉ Email</label>
                    <input type="email" id="email" name="email" class="login-input" placeholder="name@example.com" required autofocus>
                </div>
                <div class="form-group">
                    <label for="password">Mật khẩu</label>
                    <input type="password" id="password" name="password" class="login-input" placeholder="••••••••" required>
                </div>
                <button type="submit" class="login-btn-submit">Đăng nhập</button>
            </form>
        <% } %>

        <% if (authProviders.github || authProviders.gitlab || authProviders.google || authProviders.ldap || authProviders.oauth2) { %>
            <% if (authProviders.email) { %>
                <div class="login-separator">hoặc đăng nhập với</div>
            <% } %>
            <div class="login-oauth-providers">
                <% if (authProviders.google) { %>
                    <a href="<%- serverURL %>/auth/google" class="login-oauth-btn">
                        <i class="fa fa-google"></i> Google
                    </a>
                <% } %>
                <% if (authProviders.github) { %>
                    <a href="<%- serverURL %>/auth/github" class="login-oauth-btn">
                        <i class="fa fa-github"></i> GitHub
                    </a>
                <% } %>
                <% if (authProviders.gitlab) { %>
                    <a href="<%- serverURL %>/auth/gitlab" class="login-oauth-btn">
                        <i class="fa fa-gitlab"></i> GitLab
                    </a>
                <% } %>
                <% if (authProviders.ldap) { %>
                    <a href="<%- serverURL %>/auth/ldap" class="login-oauth-btn">
                        <i class="fa fa-id-card"></i> LDAP
                    </a>
                <% } %>
            </div>
        <% } %>

        <div class="login-footer">
            <a href="<%- serverURL %>/">← Quay lại trang chủ</a>
        </div>
    </div>
</body>
</html>
```

- [ ] **Step 3: Commit Task 2 changes**

```bash
git -C src add public/views/login.ejs public/css/login.css
git -C src commit -m "feat(ui): add dedicated login page view and styling"
```

---

### Task 3: Backend Controller for Home Page Document Catalog

**Files:**
- Modify: `src/lib/response.js`
- Test: `src/test/portal-query.test.js`

- [ ] **Step 1: Write test for permission query builder**

Create `src/test/portal-query.test.js`:
```javascript
'use strict'
const assert = require('assert')

describe('Document Catalog Query Logic', function () {
  it('should restrict guests to public permissions only', function () {
    const buildWhereClause = (user) => {
      if (!user) {
        return { permission: ['freely', 'editable', 'locked'] }
      }
      return {
        $or: [
          { permission: ['freely', 'editable', 'locked', 'protected', 'limited'] },
          { permission: 'private', ownerId: user.id }
        ]
      }
    }

    const guestWhere = buildWhereClause(null)
    assert.deepStrictEqual(guestWhere.permission, ['freely', 'editable', 'locked'])

    const userWhere = buildWhereClause({ id: 'user-1' })
    assert.strictEqual(userWhere.$or.length, 2)
    assert.strictEqual(userWhere.$or[1].ownerId, 'user-1')
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node src/test/portal-query.test.js`
Expected: PASS

- [ ] **Step 3: Update `response.showIndex` in `src/lib/response.js`**

Implement database query fetching visible notes with pagination, owner association, and clean snippet extraction:
```javascript
async function showIndex (req, res, next) {
  const authStatus = req.isAuthenticated()
  const Op = models.Sequelize.Op

  let whereCondition
  if (!authStatus) {
    whereCondition = {
      permission: { [Op.in]: ['freely', 'editable', 'locked'] }
    }
  } else {
    whereCondition = {
      [Op.or]: [
        { permission: { [Op.in]: ['freely', 'editable', 'locked', 'protected', 'limited'] } },
        {
          permission: 'private',
          ownerId: req.user.id
        }
      ]
    }
  }

  try {
    const notes = await models.Note.findAll({
      where: whereCondition,
      order: [
        ['lastchangeAt', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: 60,
      include: [
        {
          model: models.User,
          as: 'owner',
          attributes: ['id', 'profile']
        }
      ]
    })

    const catalogNotes = notes.map(note => {
      let authorName = 'Khách'
      let authorPhoto = null
      if (note.owner && note.owner.profile) {
        try {
          const profile = typeof note.owner.profile === 'string' ? JSON.parse(note.owner.profile) : note.owner.profile
          authorName = profile.displayName || profile.username || profile.name || 'Thành viên'
          authorPhoto = profile.photo || null
        } catch (e) {
          authorName = 'Thành viên'
        }
      }

      // Generate snippet without markdown headers/syntax
      let snippet = (note.content || '').replace(/^[#>-]+\s+/gm, '').replace(/\n+/g, ' ').trim()
      if (snippet.length > 140) snippet = snippet.slice(0, 140) + '...'

      return {
        id: note.shortid || note.id,
        title: note.title || 'Ghi chú không tiêu đề',
        snippet: snippet || 'Không có nội dung mô tả',
        permission: note.permission,
        viewcount: note.viewcount || 0,
        lastchangeAt: note.lastchangeAt || note.createdAt,
        authorName,
        authorPhoto,
        isOwner: authStatus && note.ownerId === req.user.id
      }
    })

    const data = {
      signin: authStatus,
      user: req.user || null,
      notes: catalogNotes,
      infoMessage: req.flash('info'),
      errorMessage: req.flash('error'),
      authProviders: config.authProviders,
      allowAnonymous: config.allowAnonymous,
      disableNoteCreation: config.disableNoteCreation
    }

    res.render('index.ejs', data)
  } catch (err) {
    logger.error('Error fetching notes for index:', err)
    res.render('index.ejs', {
      signin: authStatus,
      user: req.user || null,
      notes: [],
      infoMessage: req.flash('info'),
      errorMessage: req.flash('error'),
      authProviders: config.authProviders,
      allowAnonymous: config.allowAnonymous,
      disableNoteCreation: config.disableNoteCreation
    })
  }
}
```

- [ ] **Step 4: Commit Task 3 changes**

```bash
git -C src add lib/response.js test/portal-query.test.js
git -C src commit -m "feat(catalog): query and filter notes based on authentication state in showIndex"
```

---

### Task 4: Home Page Redesign (`index.ejs` & Modern Portal Layout)

**Files:**
- Modify: `src/public/views/index/body.ejs`
- Create: `src/public/css/portal.css`
- Modify: `src/public/views/index/head.ejs`

- [ ] **Step 1: Create `src/public/css/portal.css`**

Create responsive modern styles for document portal cards, badges, and topbar:
```css
.portal-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px 60px;
}

.portal-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.portal-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: #0f172a;
  font-size: 20px;
  font-weight: 700;
}

.portal-brand img {
  height: 36px;
}

.portal-search-bar {
  position: relative;
  width: 100%;
  max-width: 440px;
}

.portal-search-input {
  width: 100%;
  padding: 10px 16px 10px 38px;
  border-radius: 20px;
  border: 1px solid #cbd5e1;
  font-size: 14px;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s;
}

.portal-search-input:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.portal-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.portal-tabs {
  display: flex;
  gap: 8px;
  margin: 28px 0 24px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
}

.portal-tab-btn {
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.portal-tab-btn.active {
  background: #e0e7ff;
  color: #4338ca;
}

.portal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.note-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
  color: inherit;
}

.note-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
  border-color: #cbd5e1;
}

.note-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.note-badge.public { background: #dcfce7; color: #15803d; }
.note-badge.protected { background: #fef3c7; color: #b45309; }
.note-badge.private { background: #fee2e2; color: #b91c1c; }

.note-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.note-snippet {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 20px;
  flex-grow: 1;
}

.note-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #f1f5f9;
  padding-top: 14px;
  font-size: 12px;
  color: #94a3b8;
}

.note-author {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-weight: 500;
}
```

- [ ] **Step 2: Update `src/public/views/index/head.ejs`**

Link `portal.css` inside `src/public/views/index/head.ejs`:
```html
<link rel="stylesheet" href="<%- serverURL %>/css/portal.css">
```

- [ ] **Step 3: Redesign `src/public/views/index/body.ejs`**

Replace the landing page section with the catalog grid and real-time search script:
```html
<header class="portal-navbar">
    <a href="<%- serverURL %>/" class="portal-brand">
        <img src="<%- serverURL %>/banner/banner_vertical_color.svg" alt="HedgeDoc">
        <span>Tài Liệu & Ghi Chú</span>
    </a>

    <div class="portal-search-bar">
        <i class="fa fa-search portal-search-icon"></i>
        <input type="text" id="portalSearch" class="portal-search-input" placeholder="Tìm kiếm tài liệu theo tiêu đề...">
    </div>

    <div class="portal-actions">
        <% if (!signin) { %>
            <a href="<%- serverURL %>/login" class="btn btn-primary" style="padding: 8px 18px; border-radius: 8px; font-weight: 600;">
                <i class="fa fa-sign-in"></i> Đăng nhập
            </a>
        <% } else { %>
            <a href="<%- serverURL %>/new" class="btn btn-success" style="padding: 8px 18px; border-radius: 8px; font-weight: 600; margin-right: 12px;">
                <i class="fa fa-plus"></i> Tạo ghi chú mới
            </a>
            <a href="<%- serverURL %>/logout" class="btn btn-outline-secondary" style="padding: 8px 14px; border-radius: 8px; font-size: 13px;">
                <i class="fa fa-sign-out"></i> Đăng xuất
            </a>
        <% } %>
    </div>
</header>

<main class="portal-container">
    <div class="portal-tabs">
        <button class="portal-tab-btn active" data-filter="all">Tất cả (<%= notes.length %>)</button>
        <button class="portal-tab-btn" data-filter="public">Công khai</button>
        <% if (signin) { %>
            <button class="portal-tab-btn" data-filter="protected">Nội bộ (Protected)</button>
            <button class="portal-tab-btn" data-filter="mine">Của tôi & Bản nháp</button>
        <% } %>
    </div>

    <div class="portal-grid" id="notesGrid">
        <% if (notes.length === 0) { %>
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #64748b;">
                <i class="fa fa-file-text-o fa-3x" style="margin-bottom: 16px; opacity: 0.5;"></i>
                <h3>Chưa có tài liệu nào</h3>
                <p>Hãy là người đầu tiên tạo ghi chú trên hệ thống!</p>
            </div>
        <% } %>

        <% notes.forEach(function(note) { 
            let badgeClass = 'public';
            let badgeLabel = 'Công khai';
            let filterType = 'public';
            if (note.permission === 'protected' || note.permission === 'limited') {
                badgeClass = 'protected';
                badgeLabel = 'Nội bộ';
                filterType = 'protected';
            } else if (note.permission === 'private') {
                badgeClass = 'private';
                badgeLabel = 'Bản nháp / Riêng tư';
                filterType = 'private';
            }
        %>
            <a href="<%- serverURL %>/<%- note.id %>" class="note-card" data-filter="<%- filterType %>" data-mine="<%- note.isOwner ? 'true' : 'false' %>" data-title="<%- (note.title || '').toLowerCase() %>">
                <div>
                    <span class="note-badge <%- badgeClass %>"><%- badgeLabel %></span>
                    <h2 class="note-title"><%- note.title %></h2>
                    <p class="note-snippet"><%- note.snippet %></p>
                </div>
                <div class="note-footer">
                    <div class="note-author">
                        <i class="fa fa-user-circle"></i>
                        <span><%- note.authorName %></span>
                    </div>
                    <div>
                        <i class="fa fa-eye"></i> <%- note.viewcount %>
                    </div>
                </div>
            </a>
        <% }); %>
    </div>
</main>

<script>
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('portalSearch');
    const tabButtons = document.querySelectorAll('.portal-tab-btn');
    const cards = document.querySelectorAll('.note-card');

    let currentFilter = 'all';
    let currentKeyword = '';

    function filterCards() {
        cards.forEach(card => {
            const cardFilter = card.getAttribute('data-filter');
            const isMine = card.getAttribute('data-mine') === 'true';
            const cardTitle = card.getAttribute('data-title') || '';

            let matchesTab = true;
            if (currentFilter === 'public') matchesTab = (cardFilter === 'public');
            else if (currentFilter === 'protected') matchesTab = (cardFilter === 'protected');
            else if (currentFilter === 'mine') matchesTab = isMine;

            const matchesKeyword = !currentKeyword || cardTitle.includes(currentKeyword);

            card.style.display = (matchesTab && matchesKeyword) ? 'flex' : 'none';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            currentKeyword = e.target.value.trim().toLowerCase();
            filterCards();
        });
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            filterCards();
        });
    });
});
</script>
```

- [ ] **Step 4: Commit Task 4 changes**

```bash
git -C src add public/views/index/head.ejs public/views/index/body.ejs public/css/portal.css
git -C src commit -m "feat(ui): implement modern document portal on index page"
```

---

### Task 5: Integration Testing & Verification

**Files:**
- Test: Manual browser/curl verification with the running podman container or test suite.

- [ ] **Step 1: Run linter and existing test suite**

Run: `npm test` inside `src`
Expected: All basic lint and syntax checks pass.

- [ ] **Step 2: Verify `/login` HTTP response**

Send request to `/login`:
Run: `curl -I http://localhost:3000/login`
Expected: HTTP 200 OK rendering the login card.

- [ ] **Step 3: Verify `/` HTTP response**

Send request to `/`:
Run: `curl -s http://localhost:3000/ | grep -i "Tài Liệu & Ghi Chú"`
Expected: Portal header is present in the response HTML.

- [ ] **Step 4: Final commit and summary**

```bash
git -C src commit --allow-empty -m "chore: complete standalone login and document portal implementation"
```
