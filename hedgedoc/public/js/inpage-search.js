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
    if (searchBar) return;
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
        return; // Allow native find in CodeMirror or other inputs
      }
      e.preventDefault();
      openSearchBar();
    } else if (e.key === 'Escape') {
      if (searchBar && searchBar.style.display !== 'none') {
        closeSearchBar();
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createTriggerButton);
  } else {
    createTriggerButton();
  }
})();
