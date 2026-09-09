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

  function initDocusaurusTOC() {
    var doc = document.getElementById('doc') || document.querySelector('.markdown-body');
    var tocContainer = document.getElementById('docusaurusToc');
    if (!doc || !tocContainer) return;

    var headings = doc.querySelectorAll('h1, h2, h3');
    if (headings.length === 0) {
      // Retry once in case client-side markdown parsing is in progress
      setTimeout(function () {
        var retryHeadings = doc.querySelectorAll('h1, h2, h3');
        if (retryHeadings.length > 0) {
          initDocusaurusTOC();
        } else {
          tocContainer.style.display = 'none';
        }
      }, 200);
      return;
    }

    var list = document.createElement('ul');
    list.className = 'docusaurus-toc-list';

    var links = [];
    var headingElements = [];

    headings.forEach(function (heading, idx) {
      if (!heading.textContent || !heading.textContent.trim()) return;

      var tagLevel = parseInt(heading.tagName.replace('H', ''), 10);
      if (tagLevel > 3) return;

      if (!heading.id) {
        var slug = slugify(heading.textContent);
        heading.id = slug || ('heading-' + idx);
      }

      var item = document.createElement('li');
      item.className = 'docusaurus-toc-item level-' + tagLevel;

      var link = document.createElement('a');
      link.className = 'docusaurus-toc-link';
      link.href = '#' + heading.id;
      link.textContent = heading.textContent.trim();

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

    tocContainer.innerHTML = '<div class="docusaurus-toc-title">MỤC LỤC NỘI DUNG</div>';
    tocContainer.appendChild(list);

    // Scrollspy with IntersectionObserver
    if ('IntersectionObserver' in window && headingElements.length > 0) {
      var currentActiveLink = null;

      var observer = new IntersectionObserver(
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
          rootMargin: '0px 0px -65% 0px',
          threshold: 0.1
        }
      );

      headingElements.forEach(function (h) {
        observer.observe(h);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDocusaurusTOC);
  } else {
    initDocusaurusTOC();
  }
})();
