(function () {
  'use strict';

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  var matches = [];
  var currentIndex = -1;
  var debounceTimer = null;

  // Pop-up search bar (used in Edit mode)
  var searchBar = null;
  var popupInput = null;
  var popupCounter = null;
  var popupPrevBtn = null;
  var popupNextBtn = null;

  // Inline navbar search (used in Publish mode)
  var navbarSearchEl = null;
  var navbarInput = null;
  var navbarCounter = null;
  var navbarNav = null;
  var navbarPrevBtn = null;
  var navbarNextBtn = null;
  var navbarClearBtn = null;
  var navbarKbd = null;

  function getDocContainer() {
    return document.getElementById('doc') || document.querySelector('.markdown-body') || document.body;
  }

  function clearHighlights() {
    var container = getDocContainer();
    if (!container) return;
    var marks = container.querySelectorAll('mark.techdoc-search-match');
    for (var i = 0; i < marks.length; i++) {
      var mark = marks[i];
      var parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        mark.remove();
      }
    }
    container.normalize();
    matches = [];
    currentIndex = -1;
    updateCounters();
  }

  function updateCounters() {
    var currentInput = getActiveInput();
    var val = currentInput ? currentInput.value.trim() : '';

    // Update popup counter
    if (popupCounter) {
      if (matches.length === 0) {
        popupCounter.textContent = val ? '0 / 0' : '';
        if (popupPrevBtn) popupPrevBtn.disabled = true;
        if (popupNextBtn) popupNextBtn.disabled = true;
      } else {
        popupCounter.textContent = (currentIndex + 1) + ' / ' + matches.length;
        if (popupPrevBtn) popupPrevBtn.disabled = false;
        if (popupNextBtn) popupNextBtn.disabled = false;
      }
    }

    // Update navbar counter & controls
    if (navbarCounter) {
      if (!val) {
        navbarCounter.style.display = 'none';
        if (navbarNav) navbarNav.style.display = 'none';
        if (navbarKbd) navbarKbd.style.display = '';
      } else {
        navbarCounter.style.display = '';
        if (navbarNav) navbarNav.style.display = 'flex';
        if (navbarKbd) navbarKbd.style.display = 'none';

        if (matches.length === 0) {
          navbarCounter.textContent = '0 / 0';
          if (navbarPrevBtn) navbarPrevBtn.disabled = true;
          if (navbarNextBtn) navbarNextBtn.disabled = true;
        } else {
          navbarCounter.textContent = (currentIndex + 1) + ' / ' + matches.length;
          if (navbarPrevBtn) navbarPrevBtn.disabled = false;
          if (navbarNextBtn) navbarNextBtn.disabled = false;
        }
      }
    }
  }

  function getActiveInput() {
    if (navbarInput && document.activeElement === navbarInput) return navbarInput;
    if (popupInput && document.activeElement === popupInput) return popupInput;
    return navbarInput || popupInput;
  }

  function performSearch(keyword) {
    clearHighlights();
    keyword = (keyword || '').trim();
    if (!keyword) return;

    var container = getDocContainer();
    if (!container) return;

    var regex;
    try {
      regex = new RegExp(escapeRegExp(keyword), 'gi');
    } catch (e) {
      return;
    }

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
            if (parent.closest('.techdoc-search-bar') || parent.closest('.techdoc-navbar-search') || parent.closest('.techdoc-search-trigger')) {
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
        mark.className = 'techdoc-search-match';
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
      updateCounters();
    }
  }

  function goToMatch(index) {
    if (matches.length === 0) return;
    if (currentIndex >= 0 && currentIndex < matches.length) {
      matches[currentIndex].classList.remove('techdoc-search-current');
    }

    currentIndex = (index + matches.length) % matches.length;
    var currentMatch = matches[currentIndex];
    currentMatch.classList.add('techdoc-search-current');
    updateCounters();

    currentMatch.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  // --- Inline Navbar Search Setup ---
  function initNavbarSearch() {
    navbarSearchEl = document.getElementById('techdocNavbarSearch') || document.querySelector('.techdoc-navbar-search');
    if (!navbarSearchEl) return;

    navbarInput = navbarSearchEl.querySelector('.techdoc-navbar-search-input');
    navbarCounter = navbarSearchEl.querySelector('.techdoc-navbar-search-counter');
    navbarNav = navbarSearchEl.querySelector('.techdoc-navbar-search-nav');
    navbarPrevBtn = navbarSearchEl.querySelector('.search-prev-btn');
    navbarNextBtn = navbarSearchEl.querySelector('.search-next-btn');
    navbarClearBtn = navbarSearchEl.querySelector('.search-clear-btn');
    navbarKbd = navbarSearchEl.querySelector('.techdoc-navbar-search-kbd');

    if (navbarInput) {
      navbarInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          performSearch(navbarInput.value);
        }, 150);
      });

      navbarInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) {
            goToMatch(currentIndex - 1);
          } else {
            goToMatch(currentIndex + 1);
          }
        } else if (e.key === 'Escape') {
          navbarInput.value = '';
          clearHighlights();
          navbarInput.blur();
        }
      });
    }

    if (navbarPrevBtn) {
      navbarPrevBtn.addEventListener('click', function () {
        goToMatch(currentIndex - 1);
      });
    }

    if (navbarNextBtn) {
      navbarNextBtn.addEventListener('click', function () {
        goToMatch(currentIndex + 1);
      });
    }

    if (navbarClearBtn) {
      navbarClearBtn.addEventListener('click', function () {
        if (navbarInput) navbarInput.value = '';
        clearHighlights();
        if (navbarInput) navbarInput.focus();
      });
    }
  }

  // --- Popup Search Bar Setup (for Edit view) ---
  function openPopupSearchBar() {
    if (!searchBar) {
      createPopupSearchBar();
    }
    searchBar.style.display = 'flex';
    setTimeout(function () {
      popupInput.focus();
      popupInput.select();
    }, 50);
    if (popupInput.value.trim()) {
      performSearch(popupInput.value);
    }
  }

  function closePopupSearchBar() {
    if (searchBar) {
      searchBar.style.display = 'none';
    }
    clearHighlights();
  }

  function createPopupSearchBar() {
    if (searchBar) return;
    searchBar = document.createElement('div');
    searchBar.className = 'techdoc-search-bar';

    var icon = document.createElement('i');
    icon.className = 'fa fa-search';
    icon.style.color = '#94a3b8';
    icon.style.fontSize = '13px';
    searchBar.appendChild(icon);

    popupInput = document.createElement('input');
    popupInput.type = 'text';
    popupInput.className = 'techdoc-search-input';
    popupInput.placeholder = 'Tìm trong bài viết...';
    searchBar.appendChild(popupInput);

    popupCounter = document.createElement('span');
    popupCounter.className = 'techdoc-search-counter';
    searchBar.appendChild(popupCounter);

    popupPrevBtn = document.createElement('button');
    popupPrevBtn.className = 'techdoc-search-btn';
    popupPrevBtn.title = 'Kết quả trước (Shift+Enter)';
    popupPrevBtn.innerHTML = '<i class="fa fa-chevron-up"></i>';
    popupPrevBtn.disabled = true;
    popupPrevBtn.addEventListener('click', function () {
      goToMatch(currentIndex - 1);
    });
    searchBar.appendChild(popupPrevBtn);

    popupNextBtn = document.createElement('button');
    popupNextBtn.className = 'techdoc-search-btn';
    popupNextBtn.title = 'Kết quả tiếp theo (Enter)';
    popupNextBtn.innerHTML = '<i class="fa fa-chevron-down"></i>';
    popupNextBtn.disabled = true;
    popupNextBtn.addEventListener('click', function () {
      goToMatch(currentIndex + 1);
    });
    searchBar.appendChild(popupNextBtn);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'techdoc-search-btn close-btn';
    closeBtn.title = 'Đóng (Esc)';
    closeBtn.innerHTML = '<i class="fa fa-times"></i>';
    closeBtn.addEventListener('click', closePopupSearchBar);
    searchBar.appendChild(closeBtn);

    popupInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        performSearch(popupInput.value);
      }, 150);
    });

    popupInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          goToMatch(currentIndex - 1);
        } else {
          goToMatch(currentIndex + 1);
        }
      } else if (e.key === 'Escape') {
        closePopupSearchBar();
      }
    });

    document.body.appendChild(searchBar);
  }

  // --- Global Keyboard and Click Handlers ---
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.techdoc-search-nav-trigger');
    if (trigger) {
      e.preventDefault();
      if (navbarInput) {
        navbarInput.focus();
        navbarInput.select();
      } else {
        if (searchBar && searchBar.style.display !== 'none') {
          closePopupSearchBar();
        } else {
          openPopupSearchBar();
        }
      }
    }
  });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      var activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && activeEl !== popupInput && activeEl !== navbarInput) || (activeEl.closest && activeEl.closest('.CodeMirror')))) {
        return; // Allow native find in CodeMirror or standard inputs
      }
      e.preventDefault();
      if (navbarInput) {
        navbarInput.focus();
        navbarInput.select();
      } else {
        openPopupSearchBar();
      }
    } else if (e.key === 'Escape') {
      if (searchBar && searchBar.style.display !== 'none') {
        closePopupSearchBar();
      } else if (navbarInput && navbarInput.value) {
        navbarInput.value = '';
        clearHighlights();
        navbarInput.blur();
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbarSearch);
  } else {
    initNavbarSearch();
  }
})();
