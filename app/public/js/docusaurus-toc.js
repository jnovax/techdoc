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

  var ADMONITION_CONFIGS = {
    note: { title: 'Note', icon: 'fa-info-circle' },
    tip: { title: 'Tip', icon: 'fa-lightbulb-o' },
    info: { title: 'Info', icon: 'fa-info' },
    warning: { title: 'Warning', icon: 'fa-exclamation-triangle' },
    danger: { title: 'Danger', icon: 'fa-fire' }
  };

  function parseCalloutType(text) {
    if (!text) return null;
    var match = text.match(/^\s*\[!(NOTE|TIP|INFO|WARNING|DANGER|IMPORTANT)\]\s*(.*)$/i);
    if (match) {
      var rawType = match[1].toLowerCase();
      var type = rawType === 'important' ? 'warning' : rawType;
      return { type: type, remaining: match[2] };
    }
    return null;
  }

  function decorateAdmonitions() {
    var doc = document.getElementById('doc') || document.querySelector('.markdown-body');
    if (!doc) return;

    var blockquotes = doc.querySelectorAll('blockquote:not(.admonition-processed)');
    blockquotes.forEach(function (bq) {
      var firstP = bq.querySelector('p') || bq;
      var text = firstP.textContent || '';
      var parsed = parseCalloutType(text);
      if (parsed) {
        bq.classList.add('admonition-processed');
        bq.classList.add('admonition-box');
        bq.classList.add('alert--' + parsed.type);
        bq.classList.add('admonition-' + parsed.type);

        var cfg = ADMONITION_CONFIGS[parsed.type] || { title: parsed.type.toUpperCase(), icon: 'fa-info-circle' };

        // Clean out the leading [!TAG]
        for (var i = 0; i < firstP.childNodes.length; i++) {
          var node = firstP.childNodes[i];
          if (node.nodeType === 3 && node.nodeValue) { // Node.TEXT_NODE = 3
            var m = node.nodeValue.match(/^\s*\[!(NOTE|TIP|INFO|WARNING|DANGER|IMPORTANT)\]\s*/i);
            if (m) {
              node.nodeValue = node.nodeValue.replace(/^\s*\[!(NOTE|TIP|INFO|WARNING|DANGER|IMPORTANT)\]\s*/i, '');
              break;
            }
          }
        }

        var header = document.createElement('div');
        header.className = 'admonition-heading';
        header.innerHTML = '<i class="fa ' + cfg.icon + ' admonition-icon"></i> ' + cfg.title.toUpperCase();

        bq.insertBefore(header, bq.firstChild);
      }
    });
  }

  var observer = null;

  function buildTOC() {
    var doc = document.getElementById('doc') || document.querySelector('.markdown-body');
    var tocContainer = document.getElementById('docusaurusToc');
    var mainContainer = document.querySelector('.docusaurus-layout-wrapper') || document.querySelector('.docusaurus-container');
    if (!doc || !tocContainer) return false;

    // Decorate admonitions when markdown content is available
    decorateAdmonitions();

    // Deduplicate Document Hero Header vs first h1 in #doc
    var heroTitleElem = document.querySelector('.doc-hero-title');
    if (heroTitleElem) {
      var heroTitle = (heroTitleElem.textContent || '').trim().toLowerCase();
      var firstH = doc.querySelector('h1');
      if (firstH && heroTitle) {
        var hText = (firstH.textContent || '').trim().toLowerCase();
        if (hText === heroTitle || heroTitle.indexOf(hText) !== -1 || hText.indexOf(heroTitle) !== -1) {
          firstH.style.display = 'none';
        }
      }
    }

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
    decorateAdmonitions();
    var built = buildTOC();
    // If not built yet (e.g. client markdown rendering in progress), poll or observe
    if (!built) {
      var attempts = 0;
      var interval = setInterval(function () {
        attempts++;
        decorateAdmonitions();
        if (buildTOC() || attempts > 15) {
          clearInterval(interval);
        }
      }, 200);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      slugify: slugify,
      parseCalloutType: parseCalloutType,
      ADMONITION_CONFIGS: ADMONITION_CONFIGS
    };
  }

  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
