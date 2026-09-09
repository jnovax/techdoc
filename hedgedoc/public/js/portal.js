(function () {
  'use strict';

  function getServerURL() {
    var wrapper = document.querySelector('.portal-wrapper');
    if (wrapper && wrapper.getAttribute('data-server-url')) {
      return wrapper.getAttribute('data-server-url').replace(/\/+$/, '');
    }
    var base = document.querySelector('base');
    if (base && base.getAttribute('href')) {
      return base.getAttribute('href').replace(/\/+$/, '');
    }
    return window.location.origin;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showModal(selector) {
    if (window.jQuery && typeof window.jQuery(selector).modal === 'function') {
      window.jQuery(selector).modal('show');
    } else {
      var el = document.querySelector(selector);
      if (el) {
        el.classList.add('in');
        el.style.display = 'block';
      }
    }
  }

  function hideModal(selector) {
    if (window.jQuery && typeof window.jQuery(selector).modal === 'function') {
      window.jQuery(selector).modal('hide');
    } else {
      var el = document.querySelector(selector);
      if (el) {
        el.classList.remove('in');
        el.style.display = 'none';
      }
    }
  }

  function createTrashedCard(noteId, title, snippet, permission, viewcount, deletedAtStr) {
    var card = document.createElement('div');
    card.className = 'note-card note-card-trash';
    card.setAttribute('data-filter', 'trash');
    card.setAttribute('data-mine', 'true');
    card.setAttribute('data-id', noteId);
    card.setAttribute('data-title', (title || '').toLowerCase());
    card.setAttribute('data-permission', permission || 'freely');
    card.setAttribute('data-snippet', snippet || '');
    card.setAttribute('data-viewcount', viewcount || 0);
    card.style.display = 'none';

    var dateText = deletedAtStr ? new Date(deletedAtStr).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');

    card.innerHTML =
      '<div>' +
        '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
          '<span class="note-badge badge-trash">' +
            '<i class="fa fa-trash"></i> Đã xóa' +
          '</span>' +
        '</div>' +
        '<h2 class="note-title" style="color: #64748b; text-decoration: line-through;">' + escapeHtml(title || 'Ghi chú không tiêu đề') + '</h2>' +
        '<p class="note-snippet">' + escapeHtml(snippet || 'Không có nội dung mô tả') + '</p>' +
      '</div>' +
      '<div class="note-footer" style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">' +
        '<div style="font-size: 12px; color: #94a3b8;">' +
          '<i class="fa fa-clock-o"></i> ' + dateText +
        '</div>' +
        '<div class="note-trash-actions" style="display: flex; gap: 8px;">' +
          '<button type="button" class="btn btn-sm btn-outline-primary btn-restore-action" data-note-id="' + escapeHtml(noteId) + '" data-note-title="' + escapeHtml(title || '') + '" title="Khôi phục ghi chú" style="font-size: 12px; padding: 4px 10px; border: 1px solid #3b82f6; color: #2563eb; background: #eff6ff; border-radius: 4px; cursor: pointer;">' +
            '<i class="fa fa-undo"></i> Khôi phục' +
          '</button>' +
          '<button type="button" class="btn btn-sm btn-outline-danger btn-force-delete-action" data-note-id="' + escapeHtml(noteId) + '" data-note-title="' + escapeHtml(title || '') + '" title="Xóa vĩnh viễn" style="font-size: 12px; padding: 4px 10px; border: 1px solid #ef4444; color: #dc2626; background: #fef2f2; border-radius: 4px; cursor: pointer;">' +
            '<i class="fa fa-trash"></i> Xóa vĩnh viễn' +
          '</button>' +
        '</div>' +
      '</div>';
    return card;
  }

  function createActiveCard(serverURL, noteId, title, snippet, permission, authorName, viewcount) {
    var filterType = 'public';
    var badgeClass = 'public';
    var badgeLabel = 'Công khai';
    var badgeIcon = 'fa-globe';

    if (permission === 'protected' || permission === 'limited') {
      filterType = 'protected';
      badgeClass = 'protected';
      badgeLabel = 'Nội bộ';
      badgeIcon = 'fa-lock';
    } else if (permission === 'private') {
      filterType = 'private';
      badgeClass = 'private';
      badgeLabel = 'Bản nháp / Riêng tư';
      badgeIcon = 'fa-user-secret';
    }

    var card = document.createElement('a');
    card.href = serverURL + '/' + encodeURIComponent(noteId);
    card.className = 'note-card';
    card.setAttribute('data-filter', filterType);
    card.setAttribute('data-mine', 'true');
    card.setAttribute('data-id', noteId);
    card.setAttribute('data-title', (title || '').toLowerCase());
    card.setAttribute('data-permission', permission || 'freely');
    card.setAttribute('data-snippet', snippet || '');
    card.setAttribute('data-author', authorName || 'Của tôi');
    card.setAttribute('data-viewcount', viewcount || 0);

    card.innerHTML =
      '<div>' +
        '<div style="display: flex; justify-content: space-between; align-items: flex-start;">' +
          '<span class="note-badge ' + badgeClass + '">' +
            '<i class="fa ' + badgeIcon + '"></i> ' + badgeLabel +
          '</span>' +
          '<button type="button" class="btn-trash-action" data-note-id="' + escapeHtml(noteId) + '" data-note-title="' + escapeHtml(title || '') + '" title="Chuyển vào thùng rác">' +
            '<i class="fa fa-trash-o"></i>' +
          '</button>' +
        '</div>' +
        '<h2 class="note-title">' + escapeHtml(title || 'Ghi chú không tiêu đề') + '</h2>' +
        '<p class="note-snippet">' + escapeHtml(snippet || 'Không có nội dung mô tả') + '</p>' +
      '</div>' +
      '<div class="note-footer">' +
        '<div class="note-author">' +
          '<i class="fa fa-user-circle"></i>' +
          '<span>' + escapeHtml(authorName || 'Của tôi') + '</span>' +
        '</div>' +
        '<div>' +
          '<i class="fa fa-eye"></i> ' + (viewcount || 0) + ' lượt xem' +
        '</div>' +
      '</div>';
    return card;
  }

  var currentFilter = 'all';
  var currentKeyword = '';

  function filterCards() {
    var visibleCount = 0;
    var currentCards = document.querySelectorAll('.note-card');
    var emptyNotice = document.getElementById('emptyNotice');

    currentCards.forEach(function (card) {
      var cardFilter = card.getAttribute('data-filter');
      var isMine = card.getAttribute('data-mine') === 'true';
      var cardTitle = card.getAttribute('data-title') || '';

      var matchesTab = false;
      if (currentFilter === 'trash') {
        matchesTab = (cardFilter === 'trash');
      } else if (cardFilter === 'trash') {
        matchesTab = false;
      } else if (currentFilter === 'all') {
        matchesTab = true;
      } else if (currentFilter === 'public') {
        matchesTab = (cardFilter === 'public');
      } else if (currentFilter === 'protected') {
        matchesTab = (cardFilter === 'protected');
      } else if (currentFilter === 'mine') {
        matchesTab = isMine;
      }

      var matchesKeyword = !currentKeyword || cardTitle.indexOf(currentKeyword) !== -1;

      if (matchesTab && matchesKeyword) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (emptyNotice) {
      if (visibleCount === 0) {
        emptyNotice.style.display = 'block';
        var icon = document.getElementById('emptyNoticeIcon');
        var title = document.getElementById('emptyNoticeTitle');
        var desc = document.getElementById('emptyNoticeDesc');
        if (currentFilter === 'trash') {
          if (icon) icon.className = 'fa fa-trash-o fa-3x';
          if (title) title.textContent = 'Thùng rác trống';
          if (desc) desc.textContent = 'Không có tài liệu nào trong thùng rác.';
        } else {
          if (icon) icon.className = 'fa fa-folder-open-o fa-3x';
          if (title) title.textContent = 'Chưa có tài liệu nào';
          if (desc) desc.textContent = 'Hiện chưa có ghi chú nào phù hợp với quyền truy cập của bạn.';
        }
      } else {
        emptyNotice.style.display = 'none';
      }
    }
  }

  // Tab click delegation
  document.addEventListener('click', function (e) {
    var tabBtn = e.target.closest('.portal-tab-btn');
    if (tabBtn) {
      e.preventDefault();
      var tabButtons = document.querySelectorAll('.portal-tab-btn');
      tabButtons.forEach(function (b) { b.classList.remove('active'); });
      tabBtn.classList.add('active');
      currentFilter = tabBtn.getAttribute('data-filter') || 'all';
      filterCards();
    }
  });

  // Modal dismiss fallback
  document.addEventListener('click', function (e) {
    if (e.target.matches('[data-dismiss="modal"]') || e.target.closest('[data-dismiss="modal"]')) {
      var modal = e.target.closest('.modal');
      if (modal) {
        if (window.jQuery && typeof window.jQuery(modal).modal === 'function') {
          window.jQuery(modal).modal('hide');
        } else {
          modal.classList.remove('in');
          modal.style.display = 'none';
        }
      }
    }
  });

  // Soft delete handling
  var pendingTrashNoteId = null;
  var pendingTrashCard = null;

  document.addEventListener('click', function (e) {
    var trashBtn = e.target.closest('.btn-trash-action');
    if (trashBtn) {
      e.preventDefault();
      e.stopPropagation();
      pendingTrashNoteId = trashBtn.getAttribute('data-note-id');
      pendingTrashCard = trashBtn.closest('.note-card');
      var noteTitle = trashBtn.getAttribute('data-note-title') || 'tài liệu này';
      var titleEl = document.getElementById('trashModalNoteTitle');
      if (titleEl) titleEl.textContent = noteTitle;
      showModal('.trash-confirm-modal');
    }
  });

  // Confirm soft delete
  document.addEventListener('click', function (e) {
    var trashModalConfirmBtn = e.target.closest('#trashModalConfirmBtn');
    if (trashModalConfirmBtn) {
      if (!pendingTrashNoteId) return;
      trashModalConfirmBtn.disabled = true;
      var serverURL = getServerURL();
      fetch(serverURL + '/' + encodeURIComponent(pendingTrashNoteId) + '/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(function (res) {
        return res.json();
      }).then(function (data) {
        trashModalConfirmBtn.disabled = false;
        hideModal('.trash-confirm-modal');
        if (data && data.success) {
          var noteId = pendingTrashNoteId;
          var title = '';
          var snippet = '';
          var permission = 'freely';
          var viewcount = 0;

          if (pendingTrashCard) {
            title = (pendingTrashCard.querySelector('.note-title') ? pendingTrashCard.querySelector('.note-title').textContent : '').trim();
            snippet = pendingTrashCard.getAttribute('data-snippet') || (pendingTrashCard.querySelector('.note-snippet') ? pendingTrashCard.querySelector('.note-snippet').textContent : '').trim();
            permission = pendingTrashCard.getAttribute('data-permission') || 'freely';
            viewcount = pendingTrashCard.getAttribute('data-viewcount') || 0;

            pendingTrashCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            pendingTrashCard.style.opacity = '0';
            pendingTrashCard.style.transform = 'scale(0.9)';
            setTimeout(function () {
              pendingTrashCard.remove();
            }, 250);
          }

          var grid = document.getElementById('notesGrid');
          if (grid) {
            var trashedCard = createTrashedCard(noteId, title, snippet, permission, viewcount, new Date().toISOString());
            grid.appendChild(trashedCard);
          }

          var allCountEl = document.getElementById('allCount');
          if (allCountEl) {
            var c = parseInt(allCountEl.textContent, 10) || 0;
            allCountEl.textContent = Math.max(0, c - 1);
          }
          var trashCountEl = document.getElementById('trashCount');
          if (trashCountEl) {
            var tc = parseInt(trashCountEl.textContent, 10) || 0;
            trashCountEl.textContent = tc + 1;
          }

          setTimeout(filterCards, 260);
        } else {
          alert(data && data.error ? data.error : 'Không thể chuyển vào thùng rác');
        }
      }).catch(function () {
        trashModalConfirmBtn.disabled = false;
        hideModal('.trash-confirm-modal');
        alert('Có lỗi xảy ra khi chuyển tài liệu vào thùng rác.');
      });
    }
  });

  // Restore note handling
  document.addEventListener('click', function (e) {
    var restoreBtn = e.target.closest('.btn-restore-action');
    if (restoreBtn) {
      e.preventDefault();
      e.stopPropagation();
      var noteId = restoreBtn.getAttribute('data-note-id');
      var card = restoreBtn.closest('.note-card');
      restoreBtn.disabled = true;
      var serverURL = getServerURL();
      fetch(serverURL + '/' + encodeURIComponent(noteId) + '/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(function (res) {
        return res.json();
      }).then(function (data) {
        restoreBtn.disabled = false;
        if (data && data.success) {
          var title = '';
          var snippet = '';
          var permission = 'freely';
          var viewcount = 0;
          var authorName = 'Của tôi';

          if (card) {
            title = (card.querySelector('.note-title') ? card.querySelector('.note-title').textContent : '').trim();
            snippet = card.getAttribute('data-snippet') || (card.querySelector('.note-snippet') ? card.querySelector('.note-snippet').textContent : '').trim();
            permission = card.getAttribute('data-permission') || 'freely';
            viewcount = card.getAttribute('data-viewcount') || 0;

            card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(function () {
              card.remove();
            }, 250);
          }

          var grid = document.getElementById('notesGrid');
          if (grid) {
            var activeCard = createActiveCard(serverURL, noteId, title, snippet, permission, authorName, viewcount);
            grid.insertBefore(activeCard, grid.firstChild);
          }

          var trashCountEl = document.getElementById('trashCount');
          if (trashCountEl) {
            var tc = parseInt(trashCountEl.textContent, 10) || 0;
            trashCountEl.textContent = Math.max(0, tc - 1);
          }
          var allCountEl = document.getElementById('allCount');
          if (allCountEl) {
            var c = parseInt(allCountEl.textContent, 10) || 0;
            allCountEl.textContent = c + 1;
          }

          setTimeout(filterCards, 260);
        } else {
          alert(data && data.error ? data.error : 'Không thể khôi phục tài liệu');
        }
      }).catch(function () {
        restoreBtn.disabled = false;
        alert('Có lỗi xảy ra khi khôi phục tài liệu.');
      });
    }
  });

  // Force delete handling
  var pendingForceId = null;
  var pendingForceCard = null;

  document.addEventListener('click', function (e) {
    var forceBtn = e.target.closest('.btn-force-delete-action');
    if (forceBtn) {
      e.preventDefault();
      e.stopPropagation();
      pendingForceId = forceBtn.getAttribute('data-note-id');
      pendingForceCard = forceBtn.closest('.note-card');
      var noteTitle = forceBtn.getAttribute('data-note-title') || 'tài liệu này';
      var titleEl = document.getElementById('forceDeleteModalNoteTitle');
      if (titleEl) titleEl.textContent = noteTitle;
      showModal('.force-delete-modal');
    }
  });

  // Confirm force delete
  document.addEventListener('click', function (e) {
    var forceDeleteModalConfirmBtn = e.target.closest('#forceDeleteModalConfirmBtn');
    if (forceDeleteModalConfirmBtn) {
      if (!pendingForceId) return;
      forceDeleteModalConfirmBtn.disabled = true;
      var serverURL = getServerURL();
      fetch(serverURL + '/' + encodeURIComponent(pendingForceId) + '/force-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(function (res) {
        return res.json();
      }).then(function (data) {
        forceDeleteModalConfirmBtn.disabled = false;
        hideModal('.force-delete-modal');
        if (data && data.success) {
          if (pendingForceCard) {
            pendingForceCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            pendingForceCard.style.opacity = '0';
            pendingForceCard.style.transform = 'scale(0.9)';
            setTimeout(function () {
              pendingForceCard.remove();
              filterCards();
            }, 250);
          }
          var trashCountEl = document.getElementById('trashCount');
          if (trashCountEl) {
            var tc = parseInt(trashCountEl.textContent, 10) || 0;
            trashCountEl.textContent = Math.max(0, tc - 1);
          }
        } else {
          alert(data && data.error ? data.error : 'Không thể xóa vĩnh viễn tài liệu');
        }
      }).catch(function () {
        forceDeleteModalConfirmBtn.disabled = false;
        hideModal('.force-delete-modal');
        alert('Có lỗi xảy ra khi xóa vĩnh viễn tài liệu.');
      });
    }
  });

  function initPortal() {
    var searchInput = document.getElementById('portalSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        currentKeyword = (e.target.value || '').trim().toLowerCase();
        filterCards();
      });
    }
    filterCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortal);
  } else {
    initPortal();
  }
})();
