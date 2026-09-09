# Design Specification: HedgeDoc Standalone Login & Role-Based Document Portal

- **Date:** 2026-09-08
- **Status:** Approved
- **Target Version:** HedgeDoc 1.12.0
- **Authors:** Antigravity & User

---

## 1. Overview & Objectives

The goal of this design is to transform HedgeDoc from a collaborative markdown editor with a static marketing landing page into a **Knowledge Portal / Document Catalog** with role-based access control and a dedicated login experience:

1. **Standalone Login Page (`/login`)**:
   - Provide a clean, dedicated `/login` page replacing reliance on the landing-page modal.
   - Support redirecting users to `/login?returnTo=...` when attempting to access restricted content.
   - Automatically redirect already authenticated users back to their intended destination or home.

2. **Home Page Document Catalog (`/`)**:
   - Replace the default promotional landing page with a modern, responsive document catalog.
   - Enforce server-side permissions:
     - **Guests (Unauthenticated)**: View only public notes (`freely`, `editable`, `locked`).
     - **Members (Authenticated)**: View public notes, protected notes (`protected`, `limited`), and their own private/draft notes (`private` where `ownerId === user.id`). Other users' private notes remain completely invisible and inaccessible.
   - Provide instant keyword search, permission tabs (All, Public, Protected, My Notes), author information, last updated timestamps, and note snippets.

---

## 2. Permission & Visibility Matrix

HedgeDoc natively classifies notes using six permission types in `Note.permission`:
- `freely`: Anyone can edit and view.
- `editable`: Signed-in users can edit, anyone can view.
- `locked`: Only owner can edit, anyone can view.
- `protected`: Only owner can edit, signed-in users can view (guests forbidden).
- `limited`: Signed-in users can edit and view (guests forbidden).
- `private`: Only owner can view and edit.

### 2.1 Catalog Visibility Mapping

| Permission Level | Classification | Guest View (`/`) | Member View (`/`) | Direct URL Access (Guest) |
| :--- | :--- | :---: | :---: | :---: |
| `freely` | Public | Visible | Visible | Allowed (200) |
| `editable` | Public | Visible | Visible | Allowed (200) |
| `locked` | Public | Visible | Visible | Allowed (200) |
| `protected` | Protected | Hidden | Visible | Redirect to `/login?returnTo=...` |
| `limited` | Protected | Hidden | Visible | Redirect to `/login?returnTo=...` |
| `private` (Own) | Private / Draft | Hidden | Visible | Allowed (200) |
| `private` (Others) | Private | Hidden | Hidden | Forbidden (403/404) |

---

## 3. Architecture & Data Flow

```
[ Unauthenticated Guest ] ─── GET / ────────────────> [ response.showIndex ]
                                                              │
                                                     Query Note (Public only)
                                                              │
                                                              ▼
                                                    Render index.ejs (Public Notes)

[ Unauthenticated Guest ] ─── GET /:noteId (Protected) ─> [ note/util.checkViewPermission ]
                                                              │
                                                        Fails auth check
                                                              │
                                                              ▼
                                                    Redirect /login?returnTo=/:noteId

[ Member (Authenticated) ] ── GET / ────────────────> [ response.showIndex ]
                                                              │
                                                     Query Note (Public + Protected + Own Private)
                                                              │
                                                              ▼
                                                    Render index.ejs (Role-Based Catalog)
```

---

## 4. Detailed Component Specifications

### 4.1 Backend Routes & Controllers

#### 1. `src/lib/web/baseRouter.js`
- Register the `/login` route:
  ```javascript
  baseRouter.get('/login', response.showLogin);
  ```

#### 2. `src/lib/response.js`
- **`showLogin(req, res)`**:
  - Check `req.isAuthenticated()`. If `true`, redirect to `req.session.returnTo || '/'`.
  - If `req.query.returnTo` is provided, sanitize and store it in `req.session.returnTo`.
  - Gather authentication providers (`config.authProviders` including email, github, google, oauth2, etc.).
  - Render `login.ejs` passing `{ signin: false, infoMessage, errorMessage, authProviders, returnTo }`.
- **`showIndex(req, res)`**:
  - Build Sequelize query dynamically using `Sequelize.Op`:
    ```javascript
    const Op = models.Sequelize.Op;
    let whereCondition;

    if (!req.isAuthenticated()) {
      whereCondition = {
        permission: { [Op.in]: ['freely', 'editable', 'locked'] }
      };
    } else {
      whereCondition = {
        [Op.or]: [
          { permission: { [Op.in]: ['freely', 'editable', 'locked', 'protected', 'limited'] } },
          {
            permission: 'private',
            ownerId: req.user.id
          }
        ]
      };
    }
    ```
  - Fetch notes:
    - Include `models.User` (as owner) to display author names and avatars.
    - Order by `lastchangeAt` DESC (falling back to `createdAt`).
    - Paginate (default 24 notes per page).
  - Extract a clean preview snippet (up to 150 characters, stripping markdown syntax).
  - Pass the notes list, pagination metadata, and active filters to `index.ejs`.

#### 3. `src/lib/web/note/util.js`
- In note view permission checking:
  - If the note exists, requires authentication (`protected` or `limited`), and `!req.isAuthenticated()`:
    - Instead of immediately calling `errors.errorForbidden(res)`:
      ```javascript
      return res.redirect('/login?returnTo=' + encodeURIComponent(req.originalUrl || '/' + note.shortid));
      ```

#### 4. Post-Login Redirection (`src/lib/web/auth/email/index.js` & OAuth)
- In the authentication callback handlers:
  - Check if `req.session.returnTo` exists.
  - If valid (relative path starting with `/` to avoid open-redirect vulnerabilities), redirect to `returnTo` and `delete req.session.returnTo`.
  - Otherwise, default redirect to `/`.

---

### 4.2 Frontend Views & Templates

#### 1. Standalone Login Page (`src/public/views/login.ejs`)
- Centered card layout with shadow and responsive width (max-w-md / 420px).
- Header: HedgeDoc logo, title ("Đăng nhập hệ thống"), subtitle.
- Flash messages: Alert box for invalid credentials or session expiration warnings.
- Email / Password form:
  - Inputs with clear icons, placeholders, and focus states.
  - Submit button with loading state.
  - Link to register (if `config.allowEmailRegister` is true).
- Third-party social logins:
  - If any OAuth provider is configured (Google, GitHub, GitLab, LDAP), render social buttons below a subtle separator ("hoặc đăng nhập bằng").
- Footer: "Quay lại trang chủ" link.

#### 2. Redesigned Document Portal (`src/public/views/index.ejs` & partials)
- **Top Navigation Bar**:
  - Left: HedgeDoc logo and portal title.
  - Middle: Search input box with live instantaneous client-side filter + Enter to search.
  - Right:
    - Guest: "Đăng nhập" button (pointing to `/login`).
    - Member: "+ Tạo ghi chú mới" button (accent color), User dropdown with Profile, My Notes filter, and Sign Out.
- **Filter Tabs Bar**:
  - `Tất cả` (All accessible notes)
  - `Công khai` (Public)
  - `Nội bộ` (Protected - shown when logged in)
  - `Bản nháp / Của tôi` (Private & My Notes - shown when logged in)
- **Note Cards Grid**:
  - Responsive grid (`1 col` on mobile, `2 cols` on tablet, `3 cols` on desktop).
  - Card elements:
    - Header: Permission Badge (🟢 Công khai / 🟡 Nội bộ / 🔒 Riêng tư).
    - Title: Note title or fallback (`Untitled`).
    - Body: 2-line snippet text.
    - Footer: Author name/avatar, relative time (*vài phút trước, hôm qua...*), and view count.
- **Empty State**:
  - Friendly icon and message when no notes match the current tab or search keyword.
- **Pagination**:
  - Simple Previous/Next page controls.

---

## 5. Security & Edge Cases

1. **Open Redirect Prevention**:
   - Validate `returnTo` before redirecting. It must start with `/` and must NOT start with `//` (protocol-relative URL attack).
2. **Server-Side Enforcement**:
   - Private notes belonging to other users are never returned by the database query; client-side scripts never receive sensitive notes.
3. **Draft Safety**:
   - Notes with `permission: 'private'` are strictly constrained to `ownerId === req.user.id`.
4. **Anonymous Fallbacks**:
   - If anonymous note creation is disabled, guest "+ Tạo ghi chú" button redirects to `/login`.

---

## 6. Verification Plan

1. **Unauthenticated Access Tests**:
   - Visit `/`: Verify only public notes (`freely`, `editable`, `locked`) are listed.
   - Direct link to `protected` note: Verify automatic redirect to `/login?returnTo=...`.
   - Direct link to another user's `private` note: Verify 403 / 404 forbidden.
2. **Authentication Flow Tests**:
   - Visit `/login`: Verify login form renders properly.
   - Enter credentials on `/login?returnTo=/note-id`: Verify user is logged in and returned to `/note-id`.
   - Visit `/login` when already logged in: Verify redirect to `/`.
3. **Authenticated Portal Tests**:
   - Visit `/`: Verify public notes, protected notes, and the user's own private notes are shown. Verify other users' private notes are omitted.
   - Test tab filters: "Tất cả", "Công khai", "Nội bộ", "Của tôi".
   - Test search box with keyword filtering.
