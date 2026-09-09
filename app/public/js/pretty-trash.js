(function () {
  'use strict';

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

  function initPrettyTrash() {
    var trashBtn = document.querySelector('.ui-trash');
    var confirmBtn = document.getElementById('prettyTrashConfirmBtn');

    document.addEventListener('click', function (e) {
      if (e.target.matches('[data-dismiss="modal"]') || e.target.closest('[data-dismiss="modal"]')) {
        var modal = e.target.closest('.modal');
        if (modal) {
          hideModal(modal);
        }
      }
    });

    if (trashBtn) {
      trashBtn.addEventListener('click', function (e) {
        e.preventDefault();
        showModal('.pretty-trash-modal');
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        confirmBtn.disabled = true;
        var path = window.location.pathname.replace(/^\/+/, '');
        var parts = path.split('/');
        var noteId = parts[parts.length - 1];
        if (parts.length > 1 && parts[0] === 's') {
          noteId = parts[1];
        }
        var base = document.querySelector('base');
        var serverURL = (base && base.getAttribute('href') ? base.getAttribute('href') : window.location.origin).replace(/\/+$/, '');
        fetch(serverURL + '/' + encodeURIComponent(noteId) + '/trash', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }).then(function (res) {
          return res.json();
        }).then(function (data) {
          if (data && data.success) {
            window.location.href = serverURL + '/';
          } else {
            confirmBtn.disabled = false;
            hideModal('.pretty-trash-modal');
            alert(data && data.error ? data.error : 'Không thể chuyển vào thùng rác');
          }
        }).catch(function () {
          confirmBtn.disabled = false;
          hideModal('.pretty-trash-modal');
          alert('Có lỗi xảy ra khi thực hiện yêu cầu.');
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrettyTrash);
  } else {
    initPrettyTrash();
  }
})();
