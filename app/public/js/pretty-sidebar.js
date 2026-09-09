(function () {
  'use strict';

  function initSidebarToggle() {
    var toggleBtn = document.getElementById('sidebarToggleBtn');
    var closeBtn = document.getElementById('sidebarCloseBtn');
    var sidebar = document.getElementById('docusaurusLeftSidebar');
    if (!sidebar) return;

    var STORAGE_KEY = 'techdoc_sidebar_collapsed';

    // Determine initial state: respect user setting on desktop, collapse by default on mobile
    var isMobile = window.innerWidth <= 1024;
    var savedState = localStorage.getItem(STORAGE_KEY);
    var shouldCollapse = savedState !== null ? savedState === 'true' : isMobile;

    if (shouldCollapse) {
      sidebar.classList.add('collapsed');
    } else {
      sidebar.classList.remove('collapsed');
    }

    function toggle() {
      var isCollapsed = sidebar.classList.toggle('collapsed');
      localStorage.setItem(STORAGE_KEY, isCollapsed ? 'true' : 'false');
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function (e) {
        e.preventDefault();
        toggle();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        sidebar.classList.add('collapsed');
        localStorage.setItem(STORAGE_KEY, 'true');
      });
    }
  }

  function initTitleDeduplication() {
    var heroTitleElem = document.querySelector('.doc-hero-title');
    var doc = document.getElementById('doc');
    if (!heroTitleElem || !doc) return;

    var heroTitle = (heroTitleElem.textContent || '').trim().toLowerCase();
    if (!heroTitle) return;

    // Find the first heading element inside #doc
    var firstHeading = doc.querySelector('h1, h2');
    if (firstHeading && firstHeading.tagName.toLowerCase() === 'h1') {
      var headingText = (firstHeading.textContent || '').trim().toLowerCase();
      // If the heading text is substantially the same, hide the duplicated h1
      if (headingText === heroTitle || heroTitle.indexOf(headingText) !== -1 || headingText.indexOf(heroTitle) !== -1) {
        firstHeading.style.display = 'none';
      }
    }
  }

  function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    if (typeof moment === 'function') {
      return moment(timestamp).fromNow();
    }
    var diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
    if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
    if (diff < 2592000) return Math.floor(diff / 86400) + ' ngày trước';
    return new Date(timestamp).toLocaleDateString();
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initRecentNotesList() {
    var container = document.getElementById('sidebarNotesList');
    var searchInput = document.getElementById('sidebarQuickSearch');
    if (!container) return;

    var currentPath = window.location.pathname.replace(/^\/|\/$/g, '');
    var currentNoteId = currentPath.split('/')[0];

    function renderNotes(notes) {
      if (!Array.isArray(notes) || notes.length === 0) {
        container.innerHTML = '<div class="sidebar-empty-hint"><i class="fa fa-folder-open-o"></i> Chưa có ghi chú gần đây</div>';
        return;
      }

      var html = '';
      notes.forEach(function (note) {
        if (!note || (!note.id && !note.text)) return;
        var noteId = note.id || '';
        var noteTitle = note.text || note.title || 'Untitled';
        var noteTime = note.time || note.updatetime || note.createtime;
        var isActive = noteId && (noteId === currentNoteId || currentPath.indexOf(noteId) !== -1);

        html += '<a href="/' + encodeURIComponent(noteId) + '" class="sidebar-note-item' + (isActive ? ' active' : '') + '" data-title="' + escapeHTML(noteTitle.toLowerCase()) + '">';
        html += '  <span class="sidebar-note-item-title">' + escapeHTML(noteTitle) + '</span>';
        if (noteTime) {
          html += '  <span class="sidebar-note-item-time"><i class="fa fa-clock-o"></i> ' + formatRelativeTime(noteTime) + '</span>';
        }
        html += '</a>';
      });

      container.innerHTML = html || '<div class="sidebar-empty-hint">Không có ghi chú phù hợp</div>';
    }

    // Try reading from localStorage history
    var localHistory = [];
    try {
      var rawHistory = localStorage.getItem('history');
      if (rawHistory) {
        localHistory = JSON.parse(rawHistory);
      }
    } catch (e) {
      localHistory = [];
    }

    if (Array.isArray(localHistory) && localHistory.length > 0) {
      renderNotes(localHistory);
    } else {
      // Fallback: fetch from /history API
      fetch('/history')
        .then(function (res) {
          if (!res.ok) throw new Error('Network response not ok');
          return res.json();
        })
        .then(function (data) {
          var historyList = (data && data.history) || [];
          renderNotes(historyList);
        })
        .catch(function () {
          container.innerHTML = '<div class="sidebar-empty-hint"><i class="fa fa-info-circle"></i> Danh sách ghi chú</div>';
        });
    }

    // Quick filter search listener
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var query = (searchInput.value || '').trim().toLowerCase();
        var items = container.querySelectorAll('.sidebar-note-item');
        var visibleCount = 0;

        items.forEach(function (item) {
          var title = item.getAttribute('data-title') || '';
          if (!query || title.indexOf(query) !== -1) {
            item.style.display = 'flex';
            visibleCount++;
          } else {
            item.style.display = 'none';
          }
        });

        var emptyHint = container.querySelector('.sidebar-empty-hint');
        if (visibleCount === 0 && items.length > 0) {
          if (!emptyHint) {
            var hint = document.createElement('div');
            hint.className = 'sidebar-empty-hint';
            hint.textContent = 'Không tìm thấy ghi chú phù hợp';
            container.appendChild(hint);
          } else {
            emptyHint.style.display = 'block';
          }
        } else if (emptyHint && items.length > 0) {
          emptyHint.style.display = 'none';
        }
      });
    }
  }

  // Initialize all features once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initSidebarToggle();
      initTitleDeduplication();
      initRecentNotesList();
    });
  } else {
    initSidebarToggle();
    initTitleDeduplication();
    initRecentNotesList();
  }
})();
