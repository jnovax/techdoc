(function () {
  'use strict'

  function getSavedTheme () {
    var stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    var night = localStorage.getItem('nightMode')
    if (night === 'true') return 'dark'
    if (night === 'false') return 'light'
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  function applyTheme (theme, save) {
    var isDark = theme === 'dark'
    var root = document.documentElement
    var body = document.body

    root.setAttribute('data-theme', theme)
    if (isDark) {
      root.classList.add('night')
      if (body) body.classList.add('night')
    } else {
      root.classList.remove('night')
      if (body) body.classList.remove('night')
    }

    if (save) {
      localStorage.setItem('theme', theme)
      localStorage.setItem('nightMode', isDark ? 'true' : 'false')
      try {
        if (window.store && typeof window.store.set === 'function') {
          window.store.set('nightMode', isDark)
        }
      } catch (e) {}
    }

    // Update navbar brand logos (switch between light banner_h_bw.svg and dark banner_h_wb.svg)
    var logos = document.querySelectorAll('.docusaurus-navbar-brand img, .portal-brand img')
    for (var i = 0; i < logos.length; i++) {
      var img = logos[i]
      var currentSrc = img.getAttribute('src') || ''
      if (isDark && currentSrc.indexOf('banner_h_bw.svg') !== -1) {
        img.setAttribute('src', currentSrc.replace('banner_h_bw.svg', 'banner_h_wb.svg'))
      } else if (!isDark && currentSrc.indexOf('banner_h_wb.svg') !== -1) {
        img.setAttribute('src', currentSrc.replace('banner_h_wb.svg', 'banner_h_bw.svg'))
      }
    }

    // Update active state and icons of night buttons
    var nightBtns = document.querySelectorAll('.ui-night')
    for (var j = 0; j < nightBtns.length; j++) {
      var icon = nightBtns[j].querySelector('i')
      if (isDark) {
        nightBtns[j].classList.add('active')
        if (icon) {
          icon.classList.remove('fa-moon-o')
          icon.classList.add('fa-sun-o')
        }
      } else {
        nightBtns[j].classList.remove('active')
        if (icon) {
          icon.classList.remove('fa-sun-o')
          icon.classList.add('fa-moon-o')
        }
      }
    }
  }

  function toggleTheme () {
    var current = document.documentElement.getAttribute('data-theme') ||
      (document.body && document.body.classList.contains('night') ? 'dark' : 'light')
    var next = current === 'dark' ? 'light' : 'dark'
    applyTheme(next, true)
  }

  window.TechDocTheme = {
    get: getSavedTheme,
    apply: applyTheme,
    toggle: toggleTheme
  }

  // Early apply
  applyTheme(getSavedTheme(), false)

  // DOM ready apply & event listeners
  function init () {
    applyTheme(getSavedTheme(), false)

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('#docusaurusThemeToggle, #portalThemeToggle, .docusaurus-theme-toggle')
      if (btn) {
        e.preventDefault()
        e.stopPropagation()
        toggleTheme()
      }
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
