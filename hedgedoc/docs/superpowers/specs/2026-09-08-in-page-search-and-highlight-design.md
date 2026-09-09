# Design Specification: In-Page Content Search & Navigation with Highlighting

- **Date:** 2026-09-08
- **Status:** Approved
- **Target Version:** HedgeDoc 1.12.0
- **Authors:** Antigravity & User

---

## 1. Overview & Objectives

In long Markdown documents, users need an intuitive, fast way to search for words or phrases directly within the rendered document. This specification defines a lightweight, standalone in-page search module for HedgeDoc's note reading views (`pretty.ejs` and view modes):

1. **Floating Search Widget**:
   - A modern, floating search bar positioned at the top-right of the screen.
   - Activates via a floating search trigger button (magnifying glass icon) or standard keyboard shortcuts (`Ctrl + F` / `Cmd + F`).
2. **Real-Time Highlighting**:
   - Matches within the document text are wrapped in `<mark class="hedgedoc-search-match">` with a distinct yellow background.
   - The currently focused match receives `.hedgedoc-search-current` with a vivid orange background and outline.
3. **Step-by-Step Navigation**:
   - Up/Down navigation buttons (and `Enter` / `Shift + Enter`) cycle through matches sequentially with loop-around.
   - Match counter displays current position (e.g. `3 / 14` or `0 / 0`).
   - Active match smoothly scrolls to the vertical center of the viewport.
4. **Clean DOM Lifecycle**:
   - Closing the search bar (`Esc` or `✕` button) or clearing the input completely unrolls and normalizes text nodes, leaving zero residual DOM mutations.

---

## 2. User Interface & Interactions

### 2.1 Floating Search Bar Layout
- **Container**: Fixed pill/card at `top: 20px; right: 24px; z-index: 9999;` with white background, rounded border (radius 12px), and soft drop shadow (`0 4px 20px rgba(0,0,0,0.12)`).
- **Controls**:
  - Search Input: Clearable text field with placeholder *"Tìm trong bài viết..."*.
  - Match Counter: Displays `X / Y` or `0 / 0` in muted gray text.
  - Previous Button (`▲`): Jumps to the previous match.
  - Next Button (`▼`): Jumps to the next match.
  - Close Button (`✕`): Closes the search widget and clears all highlights.
- **Floating Trigger Button**:
  - A subtle floating circular button with magnifying glass (`🔍`) fixed at the bottom-right or top-right, enabling one-tap access on mobile and desktop without memorizing shortcuts.

### 2.2 Keyboard Shortcuts
- `Ctrl + F` / `Cmd + F`: Opens the search widget, selects all text in the search input, and focuses it.
- `Enter`: Navigates to the next match.
- `Shift + Enter`: Navigates to the previous match.
- `Escape`: Closes the search widget and clears highlights.

---

## 3. DOM Traversal & Highlight Engine

### 3.1 Container Scope
- The search engine restricts search operations strictly to the note's rendered Markdown container: `#doc.markdown-body`.
- Avoids scanning the navbar, table of contents (TOC), modals, and the search widget itself.

### 3.2 TreeWalker Algorithm
```javascript
// Pseudocode for text traversal:
function searchAndHighlight(container, keyword) {
  clearHighlights(container);
  if (!keyword || keyword.trim() === '') return [];

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
        if (parentTag === 'script' || parentTag === 'style' || parentTag === 'noscript') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  const regex = new RegExp(escapeRegExp(keyword), 'gi');
  const matches = [];

  textNodes.forEach(node => {
    // Split matching text node and wrap matched substrings in <mark class="hedgedoc-search-match">
    // Append each mark element to matches array
  });

  return matches;
}
```

### 3.3 DOM Cleanup & Restoration
- When clearing search or closing widget:
  ```javascript
  const marks = container.querySelectorAll('.hedgedoc-search-match');
  marks.forEach(mark => {
    const parent = mark.parentNode;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    mark.remove();
  });
  container.normalize(); // merge split text nodes back together
  ```

---

## 4. Visual Styling

```css
/* Matched text */
.hedgedoc-search-match {
  background-color: #fef08a !important;
  color: #1e293b !important;
  border-radius: 2px;
  padding: 0 2px;
  transition: background-color 0.15s ease-in-out;
}

/* Active current match */
.hedgedoc-search-match.hedgedoc-search-current {
  background-color: #f97316 !important;
  color: #ffffff !important;
  outline: 2px solid #ea580c;
  box-shadow: 0 0 6px rgba(249, 115, 22, 0.4);
}
```

---

## 5. Testing & Verification Plan

1. **DOM Highlighting Tests**:
   - Single and multiple occurrences of search terms are correctly identified and wrapped in `<mark>`.
   - Case-insensitive searching (`"HedgeDoc"`, `"hedgedoc"`, `"HEDGEDOC"`) works uniformly.
   - Text containing special regex characters (`[`, `]`, `*`, `?`, `(`, `)`) does not crash regex parser.
2. **Navigation Tests**:
   - Clicking Next advances from match 1 to 2, updating counter to `2 / N`.
   - Wrapping works: Next at match `N` loops back to `1`; Previous at match `1` loops back to `N`.
   - Smooth scrolling correctly aligns the active match in the center of the viewport.
3. **DOM Integrity Tests**:
   - Clearing search input or pressing `Esc` removes all `<mark>` tags.
   - `container.normalize()` restores all text nodes to their pre-search structure without altering markdown formatting.
