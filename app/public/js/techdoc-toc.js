/**
 * TechDoc - HackMD Neo Dual-Mode Responsive TOC Engine
 * Handles:
 *  1. Automatic heading indexing (H1-H4) with safe slugification
 *  2. Dual-mode responsiveness:
 *     - View mode (>= 1200px): Clean sticky sidebar on the right
 *     - Both mode (split screen) / Mobile (< 1200px): Floating pill trigger + flyout drawer
 *     - Edit mode: Hidden
 *  3. IntersectionObserver scrollspy with active indicator tracking
 *  4. Real-time debounced DOM re-indexing on markdown editing
 *  5. Smooth scrolling on anchor navigation
 */
(function () {
  'use strict';

  var headingObserver = null;
  var docMutationObserver = null;
  var debounceTimer = null;
  var isExpanded = true;

  // Safe slugify helper for headings without ID
  function slugify(text) {
    return (text || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u00C0-\u024F\u1EA0-\u1EF9\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Detect current workspace mode
  function getWorkspaceMode() {
    var editArea = document.querySelector('.ui-edit-area');
    var viewArea = document.querySelector('.ui-view-area');

    if (!viewArea) return 'edit';

    var viewStyle = window.getComputedStyle(viewArea);
    if (viewStyle.display === 'none' || viewArea.style.display === 'none') {
      return 'edit';
    }

    if (editArea) {
      var editStyle = window.getComputedStyle(editArea);
      if (editStyle.display !== 'none' && editArea.style.display !== 'none' && editArea.offsetWidth > 50) {
        return 'both';
      }
    }

    return 'view';
  }

  // Find all valid headings in #doc
  function getHeadings(doc) {
    if (!doc) return [];
    var rawHeadings = doc.querySelectorAll('h1, h2, h3, h4');
    var validHeadings = [];

    rawHeadings.forEach(function (h, idx) {
      // Ignore mathjax, hidden, or empty elements
      if (h.classList.contains('MathJax') || h.closest('.MathJax')) return;
      var text = (h.textContent || '').trim();
      if (!text) return;

      if (!h.id) {
        var slug = slugify(text);
        h.id = slug || ('neo-heading-' + idx);
      }
      validHeadings.push(h);
    });

    return validHeadings;
  }

  // Smooth scroll to target element
  function scrollToHeading(id) {
    var target = document.getElementById(id);
    if (!target) return;

    var headerHeight = 60;
    var targetRect = target.getBoundingClientRect();
    var viewArea = document.querySelector('.ui-view-area') || window;

    // Check if viewArea itself is the scrolling container (common in split view)
    var isContainerScroll = viewArea !== window && (viewArea.scrollHeight > viewArea.clientHeight + 10);

    if (isContainerScroll) {
      var currentScroll = viewArea.scrollTop;
      var offsetTop = target.offsetTop - headerHeight;
      viewArea.scrollTo({
        top: Math.max(0, offsetTop),
        behavior: 'smooth'
      });
    } else {
      var targetPosition = window.pageYOffset + targetRect.top - headerHeight;
      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'smooth'
      });
    }

    if (history.pushState) {
      history.pushState(null, null, '#' + id);
    }
  }

  // Build the list HTML inside target container
  function renderTocTree(headings, container, onLinkClick) {
    container.innerHTML = '';
    if (headings.length < 2) return;

    var list = document.createElement('ul');
    list.className = 'neo-toc-list';

    headings.forEach(function (h) {
      var level = parseInt(h.tagName.replace('H', ''), 10) || 2;
      var text = (h.textContent || '').trim();
      var id = h.id;

      var li = document.createElement('li');
      li.className = 'neo-toc-item level-' + level;

      var a = document.createElement('a');
      a.className = 'neo-toc-link';
      a.href = '#' + id;
      a.textContent = text;
      a.title = text;
      a.setAttribute('data-target-id', id);

      a.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToHeading(id);
        if (onLinkClick) onLinkClick();
      });

      li.appendChild(a);
      list.appendChild(li);
    });

    container.appendChild(list);
  }

  // Active indicator updates
  function setActiveHeading(id) {
    var allLinks = document.querySelectorAll('.neo-toc-link');
    allLinks.forEach(function (link) {
      if (link.getAttribute('data-target-id') === id) {
        link.classList.add('active');
        // If inside scrolling container, scroll link into view if needed
        var parentList = link.closest('.neo-toc-sidebar, .neo-toc-drawer');
        if (parentList) {
          var linkRect = link.getBoundingClientRect();
          var parentRect = parentList.getBoundingClientRect();
          if (linkRect.top < parentRect.top || linkRect.bottom > parentRect.bottom) {
            link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Setup IntersectionObserver for headings
  function setupScrollspy(headings) {
    if (headingObserver) {
      headingObserver.disconnect();
      headingObserver = null;
    }

    if (!('IntersectionObserver' in window) || headings.length === 0) return;

    headingObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      {
        rootMargin: '0px 0px -65% 0px',
        threshold: 0.1
      }
    );

    headings.forEach(function (h) {
      headingObserver.observe(h);
    });
  }

  // Main build & update function
  function updateNeoToc() {
    var doc = document.getElementById('doc') || document.querySelector('.markdown-body');
    var wrapper = document.getElementById('neoTocWrapper');
    var sidebar = document.getElementById('neoTocSidebar');
    var floating = document.getElementById('neoTocFloating');
    var sidebarNav = document.getElementById('neoTocContentSidebar');
    var drawerNav = document.getElementById('neoTocContentDrawer');
    var viewArea = document.querySelector('.ui-view-area');

    if (!doc || !wrapper || !sidebar || !floating) return;

    var mode = getWorkspaceMode();
    var windowWidth = window.innerWidth;

    // In Edit mode: Hide all TOC elements
    if (mode === 'edit') {
      wrapper.style.display = 'none';
      if (viewArea) viewArea.classList.remove('has-neo-toc-sidebar');
      return;
    }

    var headings = getHeadings(doc);

    // If note has fewer than 2 headings: hide TOC
    if (headings.length < 2) {
      wrapper.style.display = 'none';
      if (viewArea) viewArea.classList.remove('has-neo-toc-sidebar');
      return;
    }

    wrapper.style.display = '';

    // Render tree in both sidebar and drawer
    if (sidebarNav) {
      renderTocTree(headings, sidebarNav, null);
    }
    if (drawerNav) {
      renderTocTree(headings, drawerNav, function () {
        // Close drawer on link click
        var drawer = document.getElementById('neoTocDrawer');
        if (drawer) drawer.classList.remove('is-open');
      });
    }

    // Determine layout mode
    if (mode === 'view' && windowWidth >= 1200) {
      // View mode on wide screen: Sticky Sidebar
      sidebar.style.display = 'block';
      floating.style.display = 'none';
      if (viewArea) viewArea.classList.add('has-neo-toc-sidebar');

      // Calculate position relative to #doc
      var docRect = doc.getBoundingClientRect();
      var rightAvailable = windowWidth - (docRect.left + docRect.width);

      if (rightAvailable >= 260) {
        var sidebarLeft = docRect.left + docRect.width + 16;
        sidebar.style.left = sidebarLeft + 'px';
        sidebar.style.right = 'auto';
      } else {
        sidebar.style.left = 'auto';
        sidebar.style.right = '16px';
      }
    } else {
      // Both mode (split view) or mobile/tablet: Floating Button + Drawer
      sidebar.style.display = 'none';
      floating.style.display = 'block';
      if (viewArea) viewArea.classList.remove('has-neo-toc-sidebar');
    }

    // Initialize or refresh scrollspy
    setupScrollspy(headings);
  }

  // Setup DOM MutationObserver for live typing updates
  function setupMutationObserver() {
    if (docMutationObserver) {
      docMutationObserver.disconnect();
    }

    var doc = document.getElementById('doc') || document.querySelector('.markdown-body');
    if (!doc || !('MutationObserver' in window)) return;

    docMutationObserver = new MutationObserver(function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        updateNeoToc();
      }, 300);
    });

    docMutationObserver.observe(doc, {
      childList: true,
      subtree: true
    });
  }

  // Setup interactive UI events (drawer, expand toggle, window resize)
  function initEvents() {
    var triggerBtn = document.getElementById('neoTocTriggerBtn');
    var drawer = document.getElementById('neoTocDrawer');
    var closeBtn = document.getElementById('neoTocCloseBtn');
    var expandBtn = document.querySelector('.neo-toc-expand-toggle');

    if (triggerBtn && drawer) {
      triggerBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        drawer.classList.toggle('is-open');
      });
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        drawer.classList.remove('is-open');
      });
    }

    // Close drawer when clicking outside
    document.addEventListener('click', function (e) {
      if (drawer && drawer.classList.contains('is-open')) {
        if (!drawer.contains(e.target) && e.target !== triggerBtn) {
          drawer.classList.remove('is-open');
        }
      }
    });

    // Expand / Collapse sub-items
    if (expandBtn) {
      expandBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        isExpanded = !isExpanded;
        var subItems = document.querySelectorAll('.neo-toc-item.level-3, .neo-toc-item.level-4');
        subItems.forEach(function (item) {
          item.style.display = isExpanded ? '' : 'none';
        });
        var icon = expandBtn.querySelector('i');
        if (icon) {
          icon.className = isExpanded ? 'fa fa-angle-double-down' : 'fa fa-angle-double-right';
        }
      });
    }

    // Window resize handler with debounce
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        updateNeoToc();
      }, 150);
    });

    // Listen to mode switch buttons
    var modeButtons = document.querySelectorAll('.ui-view, .ui-both, .ui-edit');
    modeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTimeout(function () {
          updateNeoToc();
        }, 100);
      });
    });
  }

  // Initialization
  function init() {
    initEvents();
    setupMutationObserver();
    updateNeoToc();

    // Secondary pass after assets/fonts load
    setTimeout(updateNeoToc, 600);
  }

  // Export globally for integration with index.js / extra.js
  window.updateNeoToc = updateNeoToc;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
