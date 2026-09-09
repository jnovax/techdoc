(function () {
  'use strict';

  function slugify(text) {
    return (text || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u00C0-\u024F\u1EA0-\u1EF9\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  var observer = null;

  function buildTOC() {
    var doc = document.getElementById('doc') || document.querySelector('.markdown-body');
    var tocContainer = document.getElementById('docusaurusToc');
    var mainContainer = document.querySelector('.docusaurus-container');
    if (!doc || !tocContainer) return false;

    // In modern documentation (like Docusaurus), TOC only lists h2 and h3 sections
    var headings = doc.querySelectorAll('h2, h3');
    if (headings.length === 0) {
      tocContainer.style.display = 'none';
      if (mainContainer) mainContainer.classList.remove('has-toc');
      return false;
    }

    // Clean up previous observer if re-building
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    var list = document.createElement('ul');
    list.className = 'docusaurus-toc-list';

    var links = [];
    var headingElements = [];

    headings.forEach(function (heading, idx) {
      var text = (heading.textContent || '').trim();
      if (!text) return;

      var tagLevel = parseInt(heading.tagName.replace('H', ''), 10);

      if (!heading.id) {
        var slug = slugify(text);
        heading.id = slug || ('heading-' + idx);
      }

      var item = document.createElement('li');
      item.className = 'docusaurus-toc-item level-' + tagLevel;

      var link = document.createElement('a');
      link.className = 'docusaurus-toc-link';
      link.href = '#' + heading.id;
      link.textContent = text;

      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(heading.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState(null, null, '#' + heading.id);
        }
      });

      item.appendChild(link);
      list.appendChild(item);

      links.push(link);
      headingElements.push(heading);
    });

    if (links.length === 0) {
      tocContainer.style.display = 'none';
      if (mainContainer) mainContainer.classList.remove('has-toc');
      return false;
    }

    tocContainer.innerHTML = '<div class="docusaurus-toc-title">MỤC LỤC NỘI DUNG</div>';
    tocContainer.appendChild(list);
    tocContainer.style.display = '';
    if (mainContainer) mainContainer.classList.add('has-toc');

    // Scrollspy with IntersectionObserver
    if ('IntersectionObserver' in window && headingElements.length > 0) {
      var currentActiveLink = null;

      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var id = entry.target.id;
              var matchingLink = links.find(function (l) {
                return l.getAttribute('href') === '#' + id;
              });

              if (matchingLink && matchingLink !== currentActiveLink) {
                if (currentActiveLink) currentActiveLink.classList.remove('active');
                matchingLink.classList.add('active');
                currentActiveLink = matchingLink;
              }
            }
          });
        },
        {
          rootMargin: '0px 0px -60% 0px',
          threshold: 0.1
        }
      );

      headingElements.forEach(function (h) {
        observer.observe(h);
      });
    }

    return true;
  }

  function init() {
    var built = buildTOC();
    // If not built yet (e.g. client markdown rendering in progress), poll or observe
    if (!built) {
      var attempts = 0;
      var interval = setInterval(function () {
        attempts++;
        if (buildTOC() || attempts > 15) {
          clearInterval(interval);
        }
      }, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
