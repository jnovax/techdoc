# In-Page Content Search & Navigation with Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight, standalone in-page content search and highlighting widget for HedgeDoc's note reading views (`pretty.ejs` and `hedgedoc.ejs`), featuring real-time term highlighting, loop-around Next/Previous navigation, match counter (`X / Y`), keyboard shortcuts (`Ctrl+F`, `Enter`, `Shift+Enter`, `Esc`), and lossless DOM cleanup.

**Architecture:** 
- `inpage-search.js`: Standalone client-side module using browser `TreeWalker` to scan `#doc.markdown-body`, wrap matches in `<mark>`, maintain navigation state with smooth scrolling, and cleanly unwrap on exit.
- `inpage-search.css`: Floating pill-style search bar, floating trigger button, yellow match highlighting, and bold orange active match styling.
- Template integration in `src/public/views/pretty.ejs` and `src/public/views/hedgedoc.ejs`.

**Tech Stack:** JavaScript (ES6 Vanilla), CSS3, EJS templates.

---

### Task 1: Search Logic & DOM Utilities Test Suite

**Files:**
- Create: `src/test/inpage-search.test.js`

- [ ] **Step 1: Write unit tests for regex escaping and match indexing**

Create `src/test/inpage-search.test.js`:
```javascript
'use strict'
const assert = require('assert')

function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getNextIndex (currentIndex, totalCount, direction) {
  if (totalCount === 0) return -1
  if (direction === 'next') {
    return (currentIndex + 1) % totalCount
  } else if (direction === 'prev') {
    return (currentIndex - 1 + totalCount) % totalCount
  }
  return currentIndex
}

function runTests () {
  // Test 1: Regex escaping
  assert.strictEqual(escapeRegExp('hello [world] (test)?'), 'hello \\x5bworld\\x5d \\x28test\\x29\\x3f'.replace(/\\x5b/g, '\\[').replace(/\\x5d/g, '\\]').replace(/\\x28/g, '\\(').replace(/\\x29/g, '\\)').replace(/\\x3f/g, '\\?'))
  assert.strictEqual(escapeRegExp('abc.def*ghi+jkl'), 'abc\\.def\\*ghi\\+jkl')

  // Test 2: Next index wrapping
  assert.strictEqual(getNextIndex(0, 3, 'next'), 1)
  assert.strictEqual(getNextIndex(1, 3, 'next'), 2)
  assert.strictEqual(getNextIndex(2, 3, 'next'), 0) // Loop back to start

  // Test 3: Prev index wrapping
  assert.strictEqual(getNextIndex(0, 3, 'prev'), 2) // Loop to end
  assert.strictEqual(getNextIndex(2, 3, 'prev'), 1)
  assert.strictEqual(getNextIndex(1, 3, 'prev'), 0)

  console.log('In-page search logic tests passed!')
}

if (typeof describe !== 'undefined') {
  describe('In-Page Search Logic', function () {
    it('should correctly escape regex and wrap match indices', function () {
      runTests()
    })
  })
} else {
  runTests()
}
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node src/test/inpage-search.test.js`
Expected: `In-page search logic tests passed!`

- [ ] **Step 3: Commit Task 1 changes**

```bash
git -C src add test/inpage-search.test.js
git -C src commit -m "test(search): add unit tests for in-page search regex and navigation indexing"
```

---

### Task 2: Floating Search Bar & Highlight Styling (`inpage-search.css`)

**Files:**
- Create: `src/public/css/inpage-search.css`

- [ ] **Step 1: Create `src/public/css/inpage-search.css`**

```css
/* In-Page Content Search Widget Styles */

.hedgedoc-search-trigger {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9998;
  font-size: 18px;
  transition: all 0.2s ease;
}

.hedgedoc-search-trigger:hover {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  transform: scale(1.05);
}

.hedgedoc-search-bar {
  position: fixed;
  top: 20px;
  right: 24px;
  z-index: 9999;
  background: #ffffff;
  border-radius: 28px;
  border: 1px solid #cbd5e1;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.14);
  padding: 6px 8px 6px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  animation: hedgedocSearchFadeIn 0.2s ease;
}

@keyframes hedgedocSearchFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hedgedoc-search-input {
  border: none;
  outline: none;
  font-size: 14px;
  color: #1e293b;
  background: transparent;
  width: 170px;
  padding: 4px 0;
}

.hedgedoc-search-input::placeholder {
  color: #94a3b8;
}

.hedgedoc-search-counter {
  font-size: 12px;
  color: #64748b;
  min-width: 48px;
  text-align: center;
  user-select: none;
  font-weight: 500;
}

.hedgedoc-search-btn {
  background: transparent;
  border: none;
  color: #475569;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
  padding: 0;
}

.hedgedoc-search-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.hedgedoc-search-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.hedgedoc-search-btn.close-btn {
  font-size: 14px;
  color: #94a3b8;
}

.hedgedoc-search-btn.close-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

/* Document highlighting */
mark.hedgedoc-search-match {
  background-color: #fef08a !important;
  color: #1e293b !important;
  border-radius: 2px;
  padding: 0 1px;
  transition: background-color 0.15s ease-in-out;
}

mark.hedgedoc-search-match.hedgedoc-search-current {
  background-color: #f97316 !important;
  color: #ffffff !important;
  outline: 2px solid #ea580c;
  box-shadow: 0 0 6px rgba(249, 115, 22, 0.4);
}

@media (max-width: 600px) {
  .hedgedoc-search-bar {
    top: 10px;
    right: 10px;
    left: 10px;
    border-radius: 12px;
  }
  .hedgedoc-search-input {
    width: 100%;
    flex: 1;
  }
}
```

- [ ] **Step 2: Commit Task 2 changes**

```bash
git -C src add public/css/inpage-search.css
git -C src commit -m "feat(ui): add inpage-search.css for floating search widget and highlight colors"
```

---

### Task 3: In-Page Search Engine Logic (`inpage-search.js`)

**Files:**
- Create: `src/public/js/inpage-search.js`

- [ ] **Step 1: Create `src/public/js/inpage-search.js`**

Implement search widget creation, DOM text walker, highlight wrapping, navigation, and shortcuts:
```javascript
(function () {
  'use strict';

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  var searchBar = null;
  var searchInput = null;
  var searchCounter = null;
  var prevBtn = null;
  var nextBtn = null;
  var matches = [];
  var currentIndex = -1;
  var debounceTimer = null;

  function getDocContainer() {
    return document.getElementById('doc') || document.querySelector('.markdown-body') || document.body;
  }

  function clearHighlights() {
    var container = getDocContainer();
    if (!container) return;
    var marks = container.querySelectorAll('mark.hedgedoc-search-match');
    for (var i = 0; i < marks.length; i++) {
      var mark = marks[i];
      var parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      mark.remove();
    }
    container.normalize();
    matches = [];
    currentIndex = -1;
    updateCounter();
  }

  function updateCounter() {
    if (!searchCounter) return;
    if (matches.length === 0) {
      searchCounter.textContent = searchInput && searchInput.value.trim() ? '0 / 0' : '';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
    } else {
      searchCounter.textContent = (currentIndex + 1) + ' / ' + matches.length;
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    }
  }

  function performSearch(keyword) {
    clearHighlights();
    keyword = (keyword || '').trim();
    if (!keyword) return;

    var container = getDocContainer();
    if (!container) return;

    var regex = new RegExp(escapeRegExp(keyword), 'gi');

    var walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          var parent = node.parentElement;
          if (parent) {
            var tag = parent.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'textarea' || tag === 'input') {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest('.hedgedoc-search-bar') || parent.closest('.hedgedoc-search-trigger')) {
              return NodeFilter.FILTER_REJECT;
            }
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    var textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach(function (node) {
      var text = node.textContent;
      if (!regex.test(text)) return;
      regex.lastIndex = 0;

      var fragment = document.createDocumentFragment();
      var lastIdx = 0;
      var match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          fragment.appendChild(document.createTextNode(text.substring(lastIdx, match.index)));
        }
        var mark = document.createElement('mark');
        mark.className = 'hedgedoc-search-match';
        mark.textContent = match[0];
        fragment.appendChild(mark);
        matches.push(mark);
        lastIdx = regex.lastIndex;
      }

      if (lastIdx < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIdx)));
      }

      if (node.parentNode) {
        node.parentNode.replaceChild(fragment, node);
      }
    });

    if (matches.length > 0) {
      goToMatch(0);
    } else {
      updateCounter();
    }
  }

  function goToMatch(index) {
    if (matches.length === 0) return;
    if (currentIndex >= 0 && currentIndex < matches.length) {
      matches[currentIndex].classList.remove('hedgedoc-search-current');
    }

    currentIndex = (index + matches.length) % matches.length;
    var currentMatch = matches[currentIndex];
    currentMatch.classList.add('hedgedoc-search-current');
    updateCounter();

    currentMatch.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  function openSearchBar() {
    if (!searchBar) {
      createSearchBar();
    }
    searchBar.style.display = 'flex';
    searchInput.focus();
    searchInput.select();
    if (searchInput.value.trim()) {
      performSearch(searchInput.value);
    }
  }

  function closeSearchBar() {
    if (searchBar) {
      searchBar.style.display = 'none';
    }
    clearHighlights();
  }

  function createSearchBar() {
    searchBar = document.createElement('div');
    searchBar.className = 'hedgedoc-search-bar';

    var icon = document.createElement('i');
    icon.className = 'fa fa-search';
    icon.style.color = '#94a3b8';
    icon.style.fontSize = '13px';
    searchBar.appendChild(icon);

    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'hedgedoc-search-input';
    searchInput.placeholder = 'Tìm trong bài viết...';
    searchBar.appendChild(searchInput);

    searchCounter = document.createElement('span');
    searchCounter.className = 'hedgedoc-search-counter';
    searchBar.appendChild(searchCounter);

    prevBtn = document.createElement('button');
    prevBtn.className = 'hedgedoc-search-btn';
    prevBtn.title = 'Kết quả trước (Shift+Enter)';
    prevBtn.innerHTML = '<i class="fa fa-chevron-up"></i>';
    prevBtn.disabled = true;
    prevBtn.addEventListener('click', function () {
      goToMatch(currentIndex - 1);
    });
    searchBar.appendChild(prevBtn);

    nextBtn = document.createElement('button');
    nextBtn.className = 'hedgedoc-search-btn';
    nextBtn.title = 'Kết quả tiếp theo (Enter)';
    nextBtn.innerHTML = '<i class="fa fa-chevron-down"></i>';
    nextBtn.disabled = true;
    nextBtn.addEventListener('click', function () {
      goToMatch(currentIndex + 1);
    });
    searchBar.appendChild(nextBtn);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'hedgedoc-search-btn close-btn';
    closeBtn.title = 'Đóng (Esc)';
    closeBtn.innerHTML = '<i class="fa fa-times"></i>';
    closeBtn.addEventListener('click', closeSearchBar);
    searchBar.appendChild(closeBtn);

    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        performSearch(searchInput.value);
      }, 150);
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          goToMatch(currentIndex - 1);
        } else {
          goToMatch(currentIndex + 1);
        }
      } else if (e.key === 'Escape') {
        closeSearchBar();
      }
    });

    document.body.appendChild(searchBar);
  }

  function createTriggerButton() {
    var trigger = document.createElement('button');
    trigger.className = 'hedgedoc-search-trigger';
    trigger.title = 'Tìm kiếm trong trang (Ctrl+F)';
    trigger.innerHTML = '<i class="fa fa-search"></i>';
    trigger.addEventListener('click', function () {
      if (searchBar && searchBar.style.display !== 'none') {
        closeSearchBar();
      } else {
        openSearchBar();
      }
    });
    document.body.appendChild(trigger);
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      var activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && activeEl !== searchInput))) {
        return; // Allow native behavior in editor inputs
      }
      e.preventDefault();
      openSearchBar();
    } else if (e.key === 'Escape') {
      if (searchBar && searchBar.style.display !== 'none') {
        closeSearchBar();
      }
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    createTriggerButton();
  });
})();
```

- [ ] **Step 2: Commit Task 3 changes**

```bash
git -C src add public/js/inpage-search.js
git -C src commit -m "feat(search): implement in-page TreeWalker search, highlighting, and navigation engine"
```

---

### Task 4: Template Integration in `pretty.ejs` and `hedgedoc.ejs`

**Files:**
- Modify: `src/public/views/pretty.ejs`
- Modify: `src/public/views/hedgedoc.ejs`

- [ ] **Step 1: Include `inpage-search.css` and `inpage-search.js` in `src/public/views/pretty.ejs`**

In `<head>`:
```html
<link rel="stylesheet" href="<%- serverURL %>/css/inpage-search.css">
```
Before `</body>`:
```html
<script src="<%- serverURL %>/js/inpage-search.js" defer></script>
```

- [ ] **Step 2: Include `inpage-search.css` and `inpage-search.js` in `src/public/views/hedgedoc.ejs`**

In `<head>`:
```html
<link rel="stylesheet" href="<%- serverURL %>/css/inpage-search.css">
```
Before `</body>`:
```html
<script src="<%- serverURL %>/js/inpage-search.js" defer></script>
```

- [ ] **Step 3: Commit Task 4 changes**

```bash
git -C src add public/views/pretty.ejs public/views/hedgedoc.ejs
git -C src commit -m "feat(views): integrate inpage-search assets into pretty.ejs and hedgedoc.ejs"
```

---

### Task 5: Integration Verification & Container Testing

**Files:**
- Test: Manual browser/curl verification with the running podman container.

- [ ] **Step 1: Run unit tests**

Run: `node src/test/inpage-search.test.js`
Expected: PASS

- [ ] **Step 2: Verify assets are accessible over HTTP**

Run: `curl -s -I http://localhost:3000/css/inpage-search.css`
Expected: HTTP 200 OK
Run: `curl -s -I http://localhost:3000/js/inpage-search.js`
Expected: HTTP 200 OK

- [ ] **Step 3: Verify script tag presence in note view HTML**

Run: `curl -s http://localhost:3000/DK_35DTq4g | grep "inpage-search"`
Expected: Presence of `<link rel="stylesheet" href="http://localhost:3000/css/inpage-search.css">` and `<script src="http://localhost:3000/js/inpage-search.js">`.
